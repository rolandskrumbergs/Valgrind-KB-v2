import React from "react";
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";

const defaultHtmlStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#000000",
  },
  p: {
    marginBottom: 3,
    color: "#000000",
  },
  a: {
    color: "#3498db",
    textDecorationLine: "underline",
  },
  em: {
    fontStyle: "italic",
    color: "#000000",
  },
  strong: {
    fontWeight: "bold",
    color: "#000000",
  },
  ul: {
    paddingLeft: 20,
    marginBottom: 12,
  },
  ol: {
    paddingLeft: 20,
    marginBottom: 12,
  },
  li: {
    marginBottom: 6,
    color: "#000000",
  },
};

interface HtmlRendererProps {
  html: string;
  tagsStylesOverride?: Record<string, any>;
}

const HtmlRenderer = ({ html, tagsStylesOverride }: HtmlRendererProps) => {
  const { width } = useWindowDimensions();

  return (
    <RenderHTML
      contentWidth={width}
      source={{ html }}
      tagsStyles={{ ...defaultHtmlStyles, ...tagsStylesOverride }}
    />
  );
};

export default HtmlRenderer;
