import type {RectState} from "../geometry/state.js";
import * as controlCss from "./control.css?raw";

const STYLE_ID = "mGW3wTwrZ6";
const CONTROLS_ID = "E4UKgq3cxN";
const CONTROL_COL = "#44a9fe";
const GRID_COL = "rgba(64, 150, 255, 0.9)";

export function getControlBox(root: HTMLElement = document.body): HTMLDivElement {
  const box: HTMLDivElement = root.querySelector(`.${CONTROLS_ID}`)
    || root.appendChild(document.createElement("div"));
  box.classList.contains(CONTROLS_ID) || box.classList.add(CONTROLS_ID);
  box.style.setProperty("--control-color", CONTROL_COL);
  box.style.setProperty("--grid-color", GRID_COL);
  const style = (controlCss.default as string).replace(/CONTROL_ID/gm, CONTROLS_ID);
  appendStylesheetRules(style, "control-box");
  return box;
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule#examples
 */
export function appendStylesheetRules(str: string, id?: string) {
  const styleEl = (document.querySelector(`#${STYLE_ID}`)
    || document.head.appendChild(document.createElement("style"))) as HTMLStyleElement;
  styleEl.id = STYLE_ID;

  if (id) {
    styleEl.dataset.moveItAdded ??= "";
    if ((styleEl.dataset.moveItAdded).split(" ").includes(id)) return;
    else styleEl.dataset.moveItAdded += `${styleEl.dataset.moveItAdded.length > 0 ? " " : ""}${id}`;
  }

  const styleSheet = styleEl.sheet;

  if (!styleSheet) {
    throw new Error("could not retrieve stylesheet in appendStylesheetRules");
  }

  styleEl.textContent += str;
}

export function renderToCss(el: HTMLElement, state: RectState) {
  el.style.width = `${state.width}px`;
  el.style.height = `${state.height}px`;
  el.style.transform = ` 
      translate(${state.x}px, ${state.y}px)
      rotate(${state.rotation}deg)
    `;
}

/**
 * Retrieved & modified from the OP's fixed CodePen snippet
 * @see https://stackoverflow.com/questions/19574171/how-to-get-css-transform-rotation-value-in-degrees-with-javascript
 */
export function getRotation(el: HTMLElement) {
  let st = window.getComputedStyle(el, null);
  let tr = st.getPropertyValue("-webkit-transform") ||
    st.getPropertyValue("-moz-transform") ||
    st.getPropertyValue("-ms-transform") ||
    st.getPropertyValue("-o-transform") ||
    st.getPropertyValue("transform") ||
    "none";

  let angle: number;

  if (tr !== "none") {
    let v: string = tr.split('(')[1]!;
    v = v.split(')')[0]!;
    let values = v.split(',');
    let a = Number(values[0]);
    let b = Number(values[1]);

    let radians = Math.atan2(b, a);
    if (radians < 0) {
      radians += (2 * Math.PI);
    }
    angle = Math.round(radians * (180 / Math.PI));
  } else {
    angle = 0;
  }

  return angle;
}

export function getDistanceToLine(rect: DOMRect, k: number, horizontal: boolean) {
  // generated with Gemini
  if (horizontal) {
    // Line equation: y = k
    if (k < rect.top) {
      return rect.top - k;
    } else if (k > rect.bottom) {
      return k - rect.bottom;
    }
    return 0; // Line intersects the element vertically
  } else {
    // Line equation: x = k
    if (k < rect.left) {
      return rect.left - k;
    } else if (k > rect.right) {
      return k - rect.right;
    }
    return 0; // Line intersects the element horizontally
  }
}

export function getPivot(element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}