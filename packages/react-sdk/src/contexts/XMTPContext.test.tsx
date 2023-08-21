import { it, expect, describe } from "vitest";
import { render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import type { XMTPProviderProps } from "@/contexts/XMTPContext";
import { XMTPProvider } from "@/contexts/XMTPContext";

type TestWrapperProps = PropsWithChildren &
  Pick<XMTPProviderProps, "dbVersion" | "contentTypeConfigs">;

const TestWrapper: React.FC<TestWrapperProps> = ({
  contentTypeConfigs,
  children,
  dbVersion,
}) => (
  <XMTPProvider contentTypeConfigs={contentTypeConfigs} dbVersion={dbVersion}>
    {children}
  </XMTPProvider>
);

describe("XMTPProvider", () => {
  it("should render", () => {
    const { getByText } = render(<TestWrapper>test</TestWrapper>);
    expect(getByText("test")).toBeInTheDocument();
  });
});
