import type { ApiOrderInputFileType } from "@/shared/services/order-input-run.service"

export interface OrderInputFileTemplate {
  type: ApiOrderInputFileType
  /** i18n key under orders namespace, e.g. inputs.input_file_type.shipping_fee */
  labelKey: string
  /** Short file-format hint shown in template picker */
  fileHint: string
  href: string
  downloadFilename: string
}

/** Add new input types here — UI picks them up automatically. */
export const ORDER_INPUT_FILE_TEMPLATES: readonly OrderInputFileTemplate[] = [
  {
    type: "SHIPPING_FEE",
    labelKey: "inputs.input_file_type.shipping_fee",
    fileHint: "OrderSKUList .xlsx",
    href: "/samples/order-sku-list-sample.xlsx",
    downloadFilename: "shipping-fee-sample.xlsx",
  },
  {
    type: "SERVICE_FEE",
    labelKey: "inputs.input_file_type.service_fee",
    fileHint: "Payout Report .xlsx",
    href: "/samples/service-fee-sample.xlsx",
    downloadFilename: "service-fee-sample.xlsx",
  },
]

export function getOrderInputFileTemplate(
  type: ApiOrderInputFileType
): OrderInputFileTemplate | undefined {
  return ORDER_INPUT_FILE_TEMPLATES.find((template) => template.type === type)
}
