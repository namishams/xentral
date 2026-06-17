import * as React from "react";
import { color, uiConstants } from "@xentral/config";

/** Input — locked text field, 40px height, token-bound. */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{ height: uiConstants.form.inputHeight, padding: "0 12px", borderRadius: 8, border: `1px solid ${color.line.strong}`, fontSize: 13, color: color.ink.DEFAULT, outline: "none", background: color.surface.card, ...style }}
    />
  );
}
