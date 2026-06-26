# project_agent.py
from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, Tool
import os

# 1. Setup LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# 2. Define Tools
def read_file(path: str) -> str:
    """Read a project file."""
    try:
        with open(path, "r") as f:
            return f.read()
    except Exception as e:
        return str(e)

def write_file(path: str, content: str) -> str:
    """Write to a project file."""
    try:
        with open(path, "w") as f:
            f.write(content)
        return f"File {path} updated successfully."
    except Exception as e:
        return str(e)

tools = [
    Tool(name="ReadFile", func=read_file, description="Read contents of a project file"),
    Tool(name="WriteFile", func=write_file, description="Write/update project files"),
]

# 3. Initialize Agent
agent = initialize_agent(
    tools, llm, agent="zero-shot-react-description", verbose=True
)

# 4. Run agent (example)
if __name__ == "__main__":
    print(agent.run("Read the file src/api/bill.py"))
