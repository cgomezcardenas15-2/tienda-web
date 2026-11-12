import "server-only";

import { META_PIXEL_ID } from "./metaConfig";
import {
  buildMetaPurchaseEvent,
  deliverMetaEvent,
  type MetaPurchaseInput,
} from "./metaConversionsApiCore";

export type MetaCapiResult =
  | { status: "sent"; eventsReceived: number; traceId?: string }
  | { status: "skipped_no_consent" }
  | { status: "skipped_not_configured" }
  | { status: "error"; reason: string; httpStatus: number | null };

function readConfiguration() {
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN?.trim() ?? "";
  const apiVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v24.0";

  if (!accessToken) return null;
  if (!/^v\d+\.\d+$/.test(apiVersion)) {
    throw new Error("META_GRAPH_API_VERSION no tiene un formato válido.");
  }

  return { accessToken, apiVersion };
}

export async function sendMetaPurchase(options: {
  marketingConsent: boolean;
  purchase: MetaPurchaseInput;
}): Promise<MetaCapiResult> {
  if (!options.marketingConsent) return { status: "skipped_no_consent" };

  let configuration: ReturnType<typeof readConfiguration>;
  try {
    configuration = readConfiguration();
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof Error ? error.message : "Configuración inválida de Meta.",
      httpStatus: null,
    };
  }

  if (!configuration) return { status: "skipped_not_configured" };

  let event;
  try {
    event = buildMetaPurchaseEvent(options.purchase);
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof Error ? error.message : "Compra inválida para Meta.",
      httpStatus: null,
    };
  }

  const result = await deliverMetaEvent({
    pixelId: META_PIXEL_ID,
    accessToken: configuration.accessToken,
    apiVersion: configuration.apiVersion,
    event,
    maxAttempts: 2,
    retryDelayMs: 200,
  });

  if (result.ok) {
    return {
      status: "sent",
      eventsReceived: result.eventsReceived,
      traceId: result.traceId,
    };
  }

  return {
    status: "error",
    reason: result.reason,
    httpStatus: result.status,
  };
}
