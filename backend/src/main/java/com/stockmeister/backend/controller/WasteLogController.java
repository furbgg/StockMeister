package com.stockmeister.backend.controller;

import com.stockmeister.backend.dto.WasteLogDTO;
import com.stockmeister.backend.dto.WasteLogRequest;
import com.stockmeister.backend.model.WasteLog;
import com.stockmeister.backend.service.WasteLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/waste")
@RequiredArgsConstructor
@Slf4j
public class WasteLogController {

    private final WasteLogService wasteLogService;

    @GetMapping
    public ResponseEntity<List<WasteLogDTO>> getAllWasteLogs() {
        log.info("GET /api/waste");
        List<WasteLog> logs = wasteLogService.getAllWasteLogs();
        List<WasteLogDTO> dtos = logs.stream()
                .map(WasteLogDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<WasteLogDTO> createWaste(@RequestBody WasteLogRequest request) {
        log.info("POST /api/waste - Creating new waste log");
        WasteLog created = wasteLogService.createWasteLog(request);
        return ResponseEntity.ok(WasteLogDTO.fromEntity(created));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/waste/{}", id);
        wasteLogService.deleteWasteLog(id);
        return ResponseEntity.noContent().build();
    }
}
