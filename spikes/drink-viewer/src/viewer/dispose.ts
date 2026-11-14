import { InstancedMesh, Texture, type Material, type Mesh, type Object3D } from 'three';

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof Texture) value.dispose();
  }
  material.dispose();
}

export function disposeTree(root: Object3D): void {
  root.traverse((node) => {
    const drawable = node as Partial<Pick<Mesh, 'geometry' | 'material'>>;
    drawable.geometry?.dispose();
    [drawable.material ?? []].flat().forEach(disposeMaterial);
    if (node instanceof InstancedMesh) node.dispose();
  });
}
