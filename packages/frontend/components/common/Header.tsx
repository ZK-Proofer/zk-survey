import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">ZK Survey</h1>
          </div>
          <nav className="flex space-x-8 items-center">
            {user ? (
              <>
                <Button asChild variant="ghost">
                  <Link href="/create">Create Survey</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/my-surveys">My Surveys</Link>
                </Button>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {user.nickname || user.email}!
                  </span>
                  <Button onClick={logout} variant="ghost">
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
