import { writable } from "svelte/store";

function createConstraintStore() {
  // Initialize the store with an empty list of vertices and edges
  const { subscribe, set } = writable({
    vertices: [],
    edges: []
  });

  // Define a function to add a vertex to the store
  function addVertex(vertex) {
    set(store => {
      // Add the new vertex to the list
      store.vertices.push(vertex);

      // Return the updated store
      return store;
    });
  }

  // Define a function to add an edge to the store
  function addEdge(edge) {
    set(store => {
      // Add the new edge to the list
      store.edges.push(edge);

      // Return the updated store
      return store;
    });
  }

  // Define a function to update the value of a vertex
  function updateVertex(vertexId, value) {
    set(store => {
      // Find the vertex with the given id
      var vertex = store.vertices.find(v => v.id === vertexId);
      if (vertex === undefined) {
        throw new Error("Vertex not found: " + vertexId);
      }

      // Update the value of the vertex
      vertex.value = value;

      // Find all edges connected to the updated vertex
      var connectedEdges = store.edges
        .filter(e => e.vertexIds.includes(vertexId))
        // Sort the edges by priority
        .sort((a, b) => b.priority - a.priority);

      // Solve the constraints and update the values of the other vertices
      connectedEdges.forEach(edge => {
        var otherVertexId = edge.vertexIds.find(id => id !== vertexId);
        var otherVertex = store.vertices.find(v => v.id === otherVertexId);
        if (otherVertex === undefined) {
          throw new Error("Vertex not found: " + otherVertexId);
        }
        otherVertex.value = edge.solve(vertex.value, otherVertex.value);
      });

      // Return the updated store
      return store;
    });
  }

  // Return the store and the update functions
  return {
    subscribe,
    addVertex,
    addEdge,
    updateVertex
  };
}

// Create the store
const constraintStore = createConstraintStore();

// Example usage
constraintStore.addVertex({ id: "x", value: 0 });
constraintStore.addVertex({ id: "y", value: 0 });
constraintStore.addEdge({
  vertexIds: ["x", "y"],
  priority: 1,
  solve: (x, y) => 10 - x
});
constraintStore.addEdge({
  vertexIds: ["x", "y"],
  priority: 2,
  solve: (x, y) => x + y
});

constraintStore.updateVertex("x", 5);
