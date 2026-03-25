interface GistResponse {
  id: string;
  html_url: string;
}

export async function uploadToGist(
  notebookJson: string,
  filename: string
): Promise<string> {
  const response = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      description: `Paper2Notebook: ${filename}`,
      public: true,
      files: {
        [filename]: {
          content: notebookJson,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gist upload failed: ${response.status}`);
  }

  const gist: GistResponse = await response.json();
  return `https://colab.research.google.com/gist/anonymous/${gist.id}/${encodeURIComponent(filename)}`;
}
