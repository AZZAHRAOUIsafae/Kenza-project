import { AgentState } from '../types';
import { appendTrace } from './state';
import { BusinessTools } from '../tools';
import { RagService } from '../services/ragService';

export class CatalogueAgent {
  public static async execute(state: AgentState): Promise<AgentState> {
    const query = state.detectedEntities?.productName || '';
    appendTrace(state, 'catalogue_agent', 'Executing catalogue search and inventory verification', {
      query,
      size: state.detectedEntities?.size,
      color: state.detectedEntities?.color,
    });

    // 1. Search catalogue via exact/keyword match
    let searchRes = BusinessTools.searchProducts({ query });
    let products = searchRes.data || [];

    // If keyword search has no result and query exists, invoke RAG semantic search with embedder-small-3
    if (products.length === 0 && query.trim().length > 0) {
      appendTrace(state, 'catalogue_agent', 'Triggering semantic RAG search via embedder-small-3', { query });
      const ragResults = await RagService.search(query, { category: 'product', limit: 3 });
      if (ragResults.length > 0) {
        const matchedProdId = ragResults[0].chunk.metadata?.productId as string;
        if (matchedProdId) {
          const fetched = BusinessTools.getProduct(matchedProdId);
          if (fetched.success && fetched.data) {
            products = [fetched.data];
            searchRes = {
              ...searchRes,
              success: true,
              data: products,
            };
            appendTrace(state, 'catalogue_agent', 'Semantic RAG retrieved relevant product', {
              productId: fetched.data.id,
              name: fetched.data.name,
              score: ragResults[0].score,
            });
          }
        }
      }
    }

    state.toolResults['searchProducts'] = searchRes;

    if (products.length > 0) {
      if (state.cart && state.cart.items.length > 0) {
        state.selectedProduct = BusinessTools.getProduct(state.cart.items[0].productId).data || products[0];
      } else if (state.currentIntent === 'discount_negotiation') {
        state.selectedProduct = BusinessTools.getProduct('prod-djellaba-sousdi').data || products[0];
      } else {
        state.selectedProduct = products[0];
      }
      appendTrace(state, 'catalogue_agent', 'searchProducts() result loaded', {
        selectedProductId: state.selectedProduct.id,
        selectedProductName: state.selectedProduct.name,
      });

      // 2. Check stock for requested variant or default
      const requestedSize = state.detectedEntities?.size;
      const requestedColor = state.detectedEntities?.color;

      const stockRes = BusinessTools.checkStock({
        productId: state.selectedProduct.id,
        size: requestedSize,
        color: requestedColor,
      });
      state.toolResults['checkStock'] = stockRes;

      if (stockRes.success && stockRes.data) {
        appendTrace(state, 'catalogue_agent', 'checkStock() evaluated', {
          inStock: stockRes.data.inStock,
          availableQuantity: stockRes.data.quantity,
          hasAlternatives: stockRes.data.alternatives?.length > 0,
        });

        if (stockRes.data.inStock) {
          // In stock
          const variant = state.selectedProduct.variants.find((v) =>
            requestedSize ? v.size === requestedSize : v.isAvailable
          ) || state.selectedProduct.variants[0];
          state.selectedVariant = variant;
        } else {
          // OUT OF STOCK SCENARIO (Scenario B)
          // Do not hallucinate restocking dates; find genuine alternative
          const alternative = stockRes.data.alternatives?.[0];
          appendTrace(state, 'catalogue_agent', 'Out of stock detected — retrieved real alternative', {
            requestedProduct: state.selectedProduct.name,
            requestedSize,
            alternativeVariant: alternative,
          });
        }
      }
    }

    return state;
  }
}
