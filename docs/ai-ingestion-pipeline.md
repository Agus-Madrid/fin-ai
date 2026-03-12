# AI Ingestion Pipeline - Handoff Brief

Last updated: 2026-03-12  
Branch: `feat/ai`  
Scope: pipeline para convertir PDFs bancarios en transacciones `PENDING` para `review-inbox`.

## 1. Objetivo
Automatizar ingestion de estados de cuenta sin perder control humano:
- IA extrae y prepara transacciones.
- Usuario revisa y confirma.
- Nada se confirma automaticamente.

## 2. Estado Actual (As-Is)
Backend:
- Upload de PDF ya implementado (validacion + persistencia + lectura por `uploadId`).
- Storage desacoplado por adapter (`local` o `s3`).
- Abstraccion de IA existe (`AiClient`), proveedor real aun no implementado (`NullAiClient`).
- `ingestion` aun placeholder.
- `review-inbox`, `transactions` y `categories` ya funcionan.

Frontend:
- Pantalla de uploads funcional (subir/listar/abrir PDF).
- Pantalla de review inbox funcional para confirmar pendientes.

## 3. Flujo Objetivo (To-Be)
1. Usuario sube PDF.
2. Usuario dispara proceso IA por `uploadId`.
3. Pipeline lee PDF desde storage.
4. IA extrae transacciones.
5. Pipeline valida y normaliza.
6. Pipeline resuelve categorias existentes.
7. Si no hay match, puede crear categoria nueva (con guardas).
8. Pipeline guarda transacciones como `PENDING`.
9. Usuario confirma en `review-inbox`.

## 4. Reglas Duras
- Human-in-the-loop obligatorio.
- Estado final del pipeline de ingestion: `PENDING`, nunca `CONFIRMED`.
- Pipeline por etapas pequenas, testeables y desacopladas.
- Idempotencia para evitar duplicados al reprocesar upload.
- Cambio de proveedor IA no debe afectar logica de negocio.

## 5. Estructura Propuesta
Ubicacion sugerida: `backend/src/modules/ingestion/pipeline/`
- `pipeline-orchestrator.service.ts`
- `pipeline-context.interface.ts`
- `stages/*`

## 6. Stages del Pipeline
1. `LoadUploadStage`
- Input: `userId`, `uploadId`
- Output: metadata upload + `fileBuffer`
- Usa `UploadsService.getUploadFile(...)`

2. `ExtractTextStage`
- Intenta extraer texto nativo del PDF.
- Si no hay texto suficiente, deja marca para OCR.

3. `OcrFallbackStage`
- Solo corre cuando Stage 2 no alcanza.
- Output: texto util para IA.

4. `LlmExtractStage`
- Convierte texto a transacciones estructuradas.
- Debe devolver warnings cuando hay ambiguedad.

5. `NormalizeValidateStage`
- Fecha, monto, moneda, descripcion, dedupe interno.
- Output: transacciones normalizadas + warnings por fila.

6. `ResolveCategoriesStage`
- Match contra categorias existentes del usuario.
- No forzar categoria cuando hay duda.

7. `CreateCategoriesStage`
- Crea categoria solo cuando no hay match valido.
- Evitar duplicados por similitud.

8. `PersistPendingTransactionsStage`
- Persiste transacciones en estado `PENDING`.
- Mantener idempotencia por hash/clave estable.

9. `BuildReviewSummaryStage`
- Retorna resumen de corrida para UI/logs.

## 7. Endpoint Objetivo
`POST /ingestion/uploads/:uploadId/process`

Modo sugerido:
- `preview`: no persiste transacciones.
- `persist`: persiste `PENDING`.

## 8. Observabilidad Minima
Registrar por corrida:
- `userId`, `uploadId`
- etapas ejecutadas
- tiempo total y por etapa
- modelo IA y version de prompt
- cantidad extraida, descartada y persistida
- warnings y errores

## 9. Fuera de Alcance de Este Pipeline
- Insights personalizados de gasto.
- Recomendaciones o coaching financiero.
- Chat assistant de usuario.

## 10. Siguiente Paso
Implementar esqueleto tecnico minimo:
- `PipelineOrchestrator`
- contrato de `PipelineContext`
- contrato de `PipelineStage`
- `LoadUploadStage` funcional

