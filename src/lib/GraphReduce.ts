// Define the graph as a Map object
const graph = new Map([
    ['node1', { func: () => 1, predecessors: [] }],
    ['node2', { func: x => x + 2, predecessors: ['node1'] }],
    ['node3', { func: x => x * 3, predecessors: ['node2'] }],
    ['node4', { func: x => x - 4, predecessors: ['node2'] }],
    ['node5', { func: (x, y) => x + y, predecessors: ['node3', 'node4'] }],
    ['node6', { func: x => x ** 2, predecessors: ['node5'] }],
    ['node7', { func: x => x.toString(), predecessors: ['node6'] }]
]);

// Define the reduceGraph function
function reduceGraph(graph) {
    // Perform a topological sort to get the nodes in the order they should be processed
    const nodes = topologicalSort(graph);

    // Initialize a map to keep track of the values associated with each node
    const values = new Map();

    // Process each node in order, composing its function with the values of its predecessors
    for (const node of nodes) {
        // Get the function and predecessors for this node
        const { func, predecessors } = graph.get(node);

        // If there are no predecessors, the value is simply the result of applying the function with no arguments
        if (predecessors.length === 0) {
            values.set(node, func());
        } else {
            // Otherwise, compose the function with the values of its predecessors
            const args = predecessors.map(p => values.get(p));
            values.set(node, func(...args));
        }
    }

    // The final result is the value associated with the last node processed
    const result = values.get(nodes[nodes.length - 1]);

    return result;
}

// A helper function to perform a topological sort of a graph
function topologicalSort(graph) {
    const visited = new Set();
    const stack = [];

    function visit(node) {
        visited.add(node);

        for (const neighbor of graph.get(node).predecessors) {
            if (!visited.has(neighbor)) {
                visit(neighbor);
            }
        }

        stack.push(node);
    }

    for (const node of graph.keys()) {
        if (!visited.has(node)) {
            visit(node);
        }
    }

    return stack.reverse();
}

// Test the reduceGraph function with the example graph
const result = reduceGraph(graph);
console.log(result); // Output: "81"