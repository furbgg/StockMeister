package com.stockmeister.backend.repository;

import com.stockmeister.backend.model.WasteLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WasteLogRepository extends JpaRepository<WasteLog, Long> {
}
