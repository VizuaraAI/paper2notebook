export interface PromptPair {
  system: string;
  user: string;
}

export function buildNotebookPrompt(paperText: string, paperTitle: string): PromptPair {
  const system = `You are an elite research engineer at a top AI lab. Your task is to transform research papers into production-quality Google Colab notebooks that serve as comprehensive, runnable tutorials.

OUTPUT FORMAT:
You must respond with a valid JSON array of notebook cells. Each cell is an object with:
- "cell_type": either "markdown" or "code"
- "source": an array of strings (each string is one line, include "\\n" at end of each line except the last)

NOTEBOOK STRUCTURE (follow this exact order):
1. TITLE & CITATION (markdown) — Paper title as H1, authors, link placeholder, date
2. OVERVIEW (markdown) — 2-3 paragraph summary of what the paper contributes and why it matters
3. ENVIRONMENT SETUP (code) — pip installs for all required packages (numpy, scipy, matplotlib, torch, etc.)
4. IMPORTS (code) — All imports organized by category
5. BACKGROUND & THEORY (markdown + code) — For each key concept in the paper:
   - Markdown cell explaining the theory with LaTeX equations
   - Code cell demonstrating the concept with a minimal example
6. CORE ALGORITHM IMPLEMENTATION (code) — Full implementation of the paper's main algorithm(s):
   - Well-structured classes and functions
   - Type hints on all functions
   - Docstrings explaining the connection to the paper
   - Assertion checks for correctness
7. SYNTHETIC DATA GENERATION (code) — Create realistic synthetic datasets that:
   - Match the domain of the paper
   - Are complex enough to demonstrate the algorithm's behavior
   - Include proper train/test splits if applicable
8. EXPERIMENTS & RESULTS (code) — Run the implementation:
   - Apply the algorithm to synthetic data
   - Generate publication-quality plots with matplotlib
   - Print quantitative metrics and statistics
   - Compare results with baselines where appropriate
9. ANALYSIS & DISCUSSION (markdown) — Interpret results, compare with paper's findings
10. EXTENSIONS & NEXT STEPS (markdown) — Suggestions for adapting the code to real datasets

QUALITY REQUIREMENTS:
- This notebook will be used by researchers at OpenAI, DeepMind, and top universities
- Code must be production-quality: typed, documented, and runnable
- Use realistic synthetic data, not trivial toy examples
- Mathematical notation in markdown cells should use LaTeX
- All plots must have proper labels, titles, and legends
- Include error handling and edge case checks in core algorithms
- Every code cell must be independently runnable in sequence
- Use modern Python (3.10+) idioms and type hints

IMPORTANT: Respond ONLY with a JSON array of cell objects. No markdown fences, no explanations outside the JSON.`;

  const truncatedText = paperText.length > 30000
    ? paperText.slice(0, 30000) + "\n\n[Paper text truncated at 30,000 characters]"
    : paperText;

  const user = `Transform the following research paper into a comprehensive Google Colab notebook.

PAPER TITLE: ${paperTitle}

PAPER CONTENT:
${truncatedText}

Remember: respond ONLY with a JSON array of cell objects. Make the implementation thorough and research-grade.`;

  return { system, user };
}
