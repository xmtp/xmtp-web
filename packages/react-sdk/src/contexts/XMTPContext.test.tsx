import { it, expect, describe } from "vitest";
import { render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import type { XMTPProviderProps } from "@/contexts/XMTPContext";
import { XMTPProvider } from "@/contexts/XMTPContext";

type TestWrapperProps = PropsWithChildren &
  Pick<XMTPProviderProps, "dbVersion" | "beforeClearCache" | "cacheConfig">;

const TestWrapper: React.FC<TestWrapperProps> = ({
  beforeClearCache,
  cacheConfig,
  children,
  dbVersion,
}) => (
  <XMTPProvider
    beforeClearCache={beforeClearCache}
    cacheConfig={cacheConfig}
    dbVersion={dbVersion}>
    {children}
  </XMTPProvider>
);

describe("XMTPProvider", () => {
  it("should render", () => {
    const { getByText } = render(<TestWrapper>test</TestWrapper>);
    expect(getByText("test")).toBeInTheDocument();
  });
});
