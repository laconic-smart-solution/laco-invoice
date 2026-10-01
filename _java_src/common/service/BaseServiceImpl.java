package com.laconic.lacoinvoice.common.service;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.common.persistence.MasterEntity;

@Transactional
public abstract class BaseServiceImpl<E extends MasterEntity, D, C, U> implements BaseService<D, C, U> {

	protected abstract JpaRepository<E, Long> repository();

	protected abstract BaseMapper<E, D> mapper();

	protected abstract E createEntity(C request);

	protected abstract void updateEntity(E entity, U request);

	protected ResourceNotFoundException notFound(Long id) {
		return new ResourceNotFoundException("Resource not found: id=" + id);
	}

	@Override
	@Transactional(readOnly = true)
	public D getById(Long id) {
		E entity = repository().findById(id).orElseThrow(() -> notFound(id));
		return mapper().toDto(entity);
	}

	@Override
	@Transactional(readOnly = true)
	public List<D> getAll() {
		return repository().findAll().stream().map(mapper()::toDto).toList();
	}

	@Override
	public D create(C request) {
		E entity = createEntity(request);
		E saved = repository().save(entity);
		return mapper().toDto(saved);
	}

	@Override
	public D update(Long id, U request) {
		E entity = repository().findById(id).orElseThrow(() -> notFound(id));
		updateEntity(entity, request);
		E saved = repository().save(entity);
		return mapper().toDto(saved);
	}

	@Override
	public void delete(Long id) {
		E entity = repository().findById(id).orElseThrow(() -> notFound(id));
		entity.delete();
		repository().save(entity);
	}
}
