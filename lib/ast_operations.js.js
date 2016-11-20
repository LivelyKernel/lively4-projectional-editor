export let MoveStrategy = {
  SINGLE: "SINGLE",
  ALL: "ALL"
}

export function NodeWrapper(node, parentNode, parentField, parentFieldIndex = null) {
  this.node = node;
  this.parentNode = parentNode;
  this.parentField = parentField;
  this.parentFieldIndex = parentFieldIndex;
}

export function moveNode(node, newParent, newField, newIndex = null, moveStrategy = MoveStrategy.ALL) {
  
  // first case: object is only value in field
  if (oldPosition.parentFieldIndex === null) {
    let node = oldPosition.parentNode[oldPosition.parentField];
    oldPosition.parentNode[oldPosition.parentField] = null;
    
    newPosition.parentNode[newPosition.parentField] = node;
  } else {
    
    let removedNodes = [];
    let currentNodeList = oldPosition.parentNode[oldPosition.parentField];
    let newNodeList = newPosition.parentNode[newPosition.parentField];
    
    if (moveStrategy == MoveStrategy.ALL) {
      removedNodes = currentNodeList.splice(oldPosition.parentFieldIndex);
    } else {
      removedNodes = currentNodeList.splice(oldPosition.parentFieldIndex, 1);
    }
    
    
  }
}