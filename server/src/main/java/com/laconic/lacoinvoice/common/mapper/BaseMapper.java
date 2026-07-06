package com.laconic.lacoinvoice.common.mapper;

public interface BaseMapper<E, D> {

	D toDto(E entity);
}
