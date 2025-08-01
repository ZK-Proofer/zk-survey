"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 sm:py-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              ZK Survey
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8 items-center">
            {user ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-sm lg:text-base"
                >
                  <Link href="/create">Create Survey</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-sm lg:text-base"
                >
                  <Link href="/my-surveys">My Surveys</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-sm lg:text-base"
                >
                  <Link href="/my-response">My Response</Link>
                </Button>
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <span className="text-sm text-gray-600 hidden lg:block">
                    Welcome, {user.nickname || user.email}!
                  </span>
                  <Button
                    onClick={logout}
                    variant="ghost"
                    className="text-sm lg:text-base"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-sm lg:text-base"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-sm lg:text-base"
                >
                  <Link href="/my-response">My Response</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-3">
              {user ? (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start text-left"
                  >
                    <Link href="/create" onClick={closeMobileMenu}>
                      Create Survey
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start text-left"
                  >
                    <Link href="/my-surveys" onClick={closeMobileMenu}>
                      My Surveys
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start text-left"
                  >
                    <Link href="/my-response" onClick={closeMobileMenu}>
                      My Response
                    </Link>
                  </Button>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="px-3 py-2 text-sm text-gray-600">
                      Welcome, {user.nickname || user.email}!
                    </div>
                    <Button
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                      variant="ghost"
                      className="justify-start text-left w-full"
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start text-left"
                  >
                    <Link href="/login" onClick={closeMobileMenu}>
                      Login
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start text-left"
                  >
                    <Link href="/my-response" onClick={closeMobileMenu}>
                      My Response
                    </Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
