import { Link } from "react-router";
import { Plus, Sofa } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sofa className="h-5 w-5" />
          </span>
          <span className="text-lg">SofaFit Studio</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="/#benefits" className="hover:text-foreground">Benefits</a>
          <a href="/#examples" className="hover:text-foreground">Examples</a>
          <a href="/#reviews" className="hover:text-foreground">Reviews</a>
          <Link to="/admin" className="hover:text-foreground">Studio</Link>
        </nav>
        <Button asChild>
          <Link to="/new-task">
            <Plus className="mr-1 h-4 w-4" /> New task
          </Link>
        </Button>
      </div>
    </header>
  );
}
