import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { z } from "zod";
import { BlockRenderer } from "../BlockRenderer";
import { Registry } from "../registry";

// The real registry pulls in brand config from src/generated; these tests supply their own.
jest.mock("../registry", () => ({ registry: {} }));

const labelSchema = z.object({ text: z.string().min(1) });

function Label({ text }: z.infer<typeof labelSchema>) {
  return <Text>{text}</Text>;
}

function Exploding(): never {
  throw new Error("boom");
}

const testRegistry: Registry = {
  label: { schema: labelSchema, component: Label },
  exploding: { schema: z.object({}), component: Exploding },
};

const renderBlocks = (blocks: unknown[]) =>
  render(<BlockRenderer blocks={blocks} flags={{}} registry={testRegistry} />);

describe("BlockRenderer", () => {
  it("skips blocks with an unknown type and renders the rest", async () => {
    await renderBlocks([
      { id: "1", type: "does_not_exist", props: { text: "ghost" } },
      { id: "2", type: "label", props: { text: "visible" } },
    ]);

    expect(screen.getByText("visible")).toBeTruthy();
    expect(screen.queryByText("ghost")).toBeNull();
  });

  it("drops blocks whose props fail schema validation", async () => {
    await renderBlocks([
      { id: "1", type: "label", props: { text: 42 } },
      { id: "2", type: "label", props: {} },
      { id: "3", type: "label", props: { text: "valid" } },
    ]);

    expect(screen.getAllByText(/.+/)).toHaveLength(1);
    expect(screen.getByText("valid")).toBeTruthy();
  });

  it("contains a crashing block without taking down its siblings", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await renderBlocks([
      { id: "1", type: "label", props: { text: "before" } },
      { id: "2", type: "exploding", props: {} },
      { id: "3", type: "label", props: { text: "after" } },
    ]);
    spy.mockRestore();

    expect(screen.getByText("before")).toBeTruthy();
    expect(screen.getByText("after")).toBeTruthy();
  });
});
