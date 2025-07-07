from vllm import LLM

llm = LLM(
    model="/home/alex/projects/gemma-2-9b-it-AWQ-INT4",
    gpu_memory_utilization=0.80,
    max_model_len=2048,
)
