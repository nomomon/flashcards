import { FC, Suspense } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return <Suspense>{children}</Suspense>;
};

export default Layout;
