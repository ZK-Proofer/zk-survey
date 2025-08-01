import { Header } from "@/components/common/Header";

export default function MySurveysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
