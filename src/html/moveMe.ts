import {RectState} from "../geometry/state";
import {getRotation, renderToCss} from "./htmlUtil";
import {Controls, updateControls} from "../geometry/controls";

export interface MoveMeOpt {
  initialState: RectState | undefined,
  onChange: (next: RectState) => void
}

export interface Moving {
  element: HTMLElement,
  state: RectState,
  destroy: () => void,
  render: () => void,
  select: () => void,
  updateControls: () => Controls
}

export function moveMe(element: HTMLElement, option: MoveMeOpt | undefined): Moving {
  element.dataset.moveItId = generateUID();
  let state: RectState | undefined;
  if (option && (state = option.initialState))
    renderToCss(element, option.initialState);
  else {
    state = {
      x: ((element.parentElement?.clientLeft || 0) - element.clientLeft),
      y: ((element.parentElement?.clientTop || 0) - element.clientTop),
      width: element.clientWidth,
      height: element.offsetHeight,
      rotation: getRotation(element),
    }
  }

  let selected = false;

  const moving: Moving = {
    element,
    state,
    destroy: () => {
      delete element.dataset.moveItId;
    },
    render: () => {
      renderToCss(element, state);
      controls = updateControls(element, moving);
    },
    select: () => {
      selected = true;
      controls = updateControls(element, moving);
    },
    updateControls: () => controls = updateControls(element, moving)
  };
  let controls: Controls = updateControls(element, moving);
  return moving
}

// Source - https://stackoverflow.com/a/6248722
// Posted by kennytm, modified by community. See post 'Timeline' for change history
// Retrieved 2026-06-17, License - CC BY-SA 3.0

function generateUID() {
  // I generate the UID from two parts here
  // to ensure the random number provide enough bits.
  let firstPart: any = (Math.random() * 46656) | 0;
  let secondPart: any = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}
