# Move it!
![hackatime badge](https://hackatime.hackclub.com/api/v1/badge/U07A64GBPV1/AndyNoob/move-it)

A library that adds simple PowerPoint like DOM object manipulation: resize, drag, and rotate. Pretty lightweight and comes with (very beautifully) styled controls. This library also provides the means for you to calculate collision via an implementation of oriented bounding boxes.

<img alt="demo gif" src="assets/move-it-demo.gif" width="480"/>

## The lifecycle

> [!NOTE] Fully functional sample code can be found [here](playground/main.ts).

To start, create an instance of `Moving` by calling `createMoveMe` (or `MoveIt.createMoveMe`). For example:
```ts
const el = document.querySelector(/* ... */);
const controlRoot = el.parentElement!;
const snapping = {
  // omitted... we'll get to this later
};

const moving = createMoveMe(el, {
  initialState: { // optional, the code will call computeState on the target (first parameter) if this is absent
    x: 200,
    y: 200,
    width: 200,
    height: 120,
    rotation: 75
  },
  snapping, // optional
  controlRoot // required, sets the bounds for the object  
});
```

> [!NOTE] If `initialState` is not present as a part of the option parameter, `computeState` will be called to calculate a `RectState` from the target element (width, rotation, etc.).

Calling the `createMoveMe` function will return an instance of the `Moving` interface: 
```ts
interface Moving {
  element: HTMLElement,
  id: string,
  getState: () => RectState,
  destroy: () => void,
  render: () => void,
  select: () => void,
  isSelected: () => boolean,
  checkBounds: () => void,
  updateControls: () => Controls,
  getCollisionSiblings: () => Moving[],
  /**
   * You need to do this for both instances, the behavior is not mirrored by default
   * For example, say you have `instanceA` and `instanceB`, you need to run both
   * `instanceA.addCollisionSibling(instanceB)` and `instanceB.addCollisionSibling(instanceA)`
   * for both instances to collide with the other.
   */
  addCollisionSibling: (sibling: Moving) => void,
  removeCollisionSibling: (sibling: Moving) => void,
}
```

Call `destroy` when you're done moving the object. 

## The transform controls

The transform control is added immediately when you call the `createMoveMe`. As seen in the GIF below, it consists of five lines and five dots.

<img alt="transforms gif" src="assets/move-it-transform-controls.gif" width="480"/>

The CSS for these controls can be found [here](src/dom/control.css) (the `CONTROL_ID` is `E4UKgq3cxN`, contrary to its name, it's actually a class). The style is injected into the `<head>` tag (if not present), under a `<style>` tag with id `mGW3wTwrZ6`. The `cursor` CSS property is updated accordingly to the rotation of the rectangle. Every moving element is given the `move` cursor.

## The transformations

1. Dragging the rectangle itself will move the rectangle.
2. Dragging the lone dot protruding from the right side of the rectangle will start rotating.
3. Dragging the sides of the rectangle will scale the rectangle in that direction only. Whereas the dots on the corners allow free transform. The user may hold shift to keep ratio when free transforming.

## Snapping

There are two types of snapping behaviors: rotation snapping, and guideline based snapping. 

| Rotation Snap                                                                 | Guideline Snap                                                                  |
|-------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| <img alt="rotation snap" src="assets/move-it-rotation-snap.gif" width="480"/> | <img alt="guideline snap" src="assets/move-it-guideline-snap.gif" width="480"/> |

The `SnappingOpt` interface is defined as follows:
```ts
export interface SnappingOpt {
  rotation?: SnappingRotation,
  grid?: SnappingGrid
}

export interface SnappingGrid {
  /**
   * number of pixels away to snap the element
   */
  threshold: number,
  /**
   * number of pixels away to display the nearest grid/guideline
   */
  displayThreshold: number,
  verticalX?: number[], // relative to the control root
  horizontalY?: number[] // also relative to the control root
}

export interface SnappingRotation {
  anglesDeg: number[],
  threshold: number // degrees also
}
```

Simply provide that in the option parameter of `createMoveMe`, like so:

```ts
const moving = createMoveMe(el, {
  snapping: {
    rotation: {
      anglesDeg: [0, 180],
      threshold: 5
    },
    grid: {
      displayThreshold: 20,
      threshold: 5,
      verticalX: [controlRoot.offsetWidth / 2],
      horizontalY: [controlRoot.offsetHeight / 10 * 8]
    }
  },
  controlRoot
});
```

The snapping behavior can be disabled by the user if they hold shift while dragging/rotating the element. 