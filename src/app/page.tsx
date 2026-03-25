export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Paper2Notebook
        </h1>
        <p className="text-lg text-muted-foreground">
          Transform research papers into production-quality Google Colab
          notebooks.
        </p>
      </div>
    </main>
  );
}
