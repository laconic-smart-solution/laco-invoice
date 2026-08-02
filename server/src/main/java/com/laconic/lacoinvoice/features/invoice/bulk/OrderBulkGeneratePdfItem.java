package com.laconic.lacoinvoice.features.invoice.bulk;

import java.nio.file.Path;

public record OrderBulkGeneratePdfItem(Path path, String filename) {
}
