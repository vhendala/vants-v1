/**
 * blend/index.ts — Re-exports do serviço Blend.
 */
export { buildBlendTx, getBlendData } from "./client";
export type {
  BlendData,
  BlendReserveInfo,
  BlendUserPosition,
} from "./client";
export {
  BLEND_POOL_ADDRESS,
  BLEND_ASSETS,
  BLEND_NETWORK,
  type BlendAction,
} from "./config";
