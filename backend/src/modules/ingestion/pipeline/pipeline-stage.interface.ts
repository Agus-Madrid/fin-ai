import { PipelineContext } from './pipeline-context.interface';

export interface PipelineStage {
  readonly name: string;
  executeStage(context: PipelineContext): Promise<PipelineContext>;
}
