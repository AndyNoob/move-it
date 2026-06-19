import {moveRect, RectState, resizeRect} from "../geometry/state";
import {getRotation, renderToCss} from "./htmlUtil";
import {Controls, DotDesignation, LineDesignation, updateControls} from "../geometry/controls";
import {abs, dot, normalize, rotate, scale} from "../geometry/geometry";

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

interface PointerPos {
  x: number,
  y: number
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
  let mode: "drag" | "resize" | "rotate" | null = null;
  let data: any = null;
  let startPos: { x: number, y: number };
  let startState: RectState;

  function onPointerDown(event: PointerEvent) {
    if (!(event.target instanceof HTMLElement)) {
      selected = false;
      render();
      return;
    }

    const sameElement = element.isSameNode(event.target);
    const dotClick = controls.getDotDesignation(event.target);
    const lineClick = controls.getLineDesignation(event.target);

    if (!(sameElement || dotClick || (lineClick && lineClick.name !== "rotate"))) {
      selected = false;
      render();
      return;
    }

    selected = true;
    render();

    if (sameElement) {
      mode = "drag";
    } else {
      if (dotClick?.name === "rotate") mode = "rotate";
      else {
        data = dotClick || lineClick;
        mode = "resize";
      }
    }

    startState = state!;
    startPos = event;
  }

  function onPointerMove(event: PointerEvent) {
    if (!state) return;
    const delta = getPointerDelta(startPos, event);

    switch (mode) {
      case "drag": {
        state = moveRect(startState, delta.x, delta.y);
        break;
      }
      case "resize": {
        startPos = event;
        const designation: Exclude<DotDesignation, "rotate"> | Exclude<LineDesignation, "rotate"> = data;
        const direction = normalize(rotate(designation.direction, state.rotation));

        const keepRatio = designation.cardinal || event.shiftKey;

        let sizeDelta: { x: number; y: number };

        if (keepRatio) {
          const dotVal = dot(direction, delta);
          sizeDelta = scale(abs(direction), dotVal);
        } else {
          const absDelta = abs(delta)
          sizeDelta = {
            x: Math.sign(delta.x) === Math.sign(direction.x) ? absDelta.x : -absDelta.x,
            y: Math.sign(delta.y) === Math.sign(direction.y) ? absDelta.y : -absDelta.y
          };
        }

        state = resizeRect(state, sizeDelta.x, sizeDelta.y);

        if (direction.x < 0) {
          state = moveRect(state, -sizeDelta.x, 0);
        }

        if (direction.y < 0) {
          state = moveRect(state, 0, -sizeDelta.y);
        }

        break;
      }
      case "rotate": {
        break;
      }
    }
    option?.onChange(state);
    moving.state = state;
    render();
  }

  function onPointerUp() {
    mode = null;
  }

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  function render() {
    renderToCss(element, state!);
    controls = updateControls(element, moving, selected);
  }

  const moving: Moving = {
    element,
    state,
    destroy: () => {
      controls.destroy();
      delete element.dataset.moveItId;
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    },
    render,
    select: () => {
      selected = true;
      controls = updateControls(element, moving);
    },
    updateControls: (select = false) => {
      return controls = updateControls(element, moving, selected = select);
    }
  };

  let controls = updateControls(element, moving, false);
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

function getPointerDelta(start: PointerPos, end: PointerPos): PointerPos {
  if (!start || !end) return {x: 0, y: 0};
  return {x: end.x - start.x, y: end.y - start.y};
}