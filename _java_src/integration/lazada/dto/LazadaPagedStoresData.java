package com.laconic.lacoinvoice.integration.lazada.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LazadaPagedStoresData(List<LazadaStoreData> items, LazadaPageMeta meta) {
}
