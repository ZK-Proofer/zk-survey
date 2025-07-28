import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "@/hooks/auth/useAuth";

interface HomeContentProps {
  user: User | null;
}

export function HomeContent({ user }: HomeContentProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Anonymous Survey System with ZK Proofs
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Conduct trustworthy surveys while protecting personal information
          using Zero-Knowledge Proofs.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Survey Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl font-semibold">
                Create Survey
              </CardTitle>
              <CardDescription>
                Create a new survey and send invitations via email to
                participants.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {user ? (
                <Button asChild size="lg">
                  <Link href="/create">Create Survey</Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/login">Login to Create</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Participate Survey Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl font-semibold">
                Participate in Survey
              </CardTitle>
              <CardDescription>
                Click the link received via email to participate in surveys
                anonymously.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-gray-500">
                Click the link received via email
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Key Features
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg font-semibold">
                  Zero-Knowledge Proofs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Verify survey participation without revealing personal
                  information using advanced cryptographic techniques.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg font-semibold">
                  Privacy Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ensure complete anonymity while maintaining survey integrity
                  and preventing duplicate submissions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg font-semibold">
                  Duplicate Prevention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Effectively prevent duplicate participation using commitments
                  generated from UUID and password combinations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
