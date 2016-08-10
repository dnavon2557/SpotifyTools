$(document).ready(function() {
    draw_paths();
});
function draw_paths () {
    $("#authorize-tools").HTMLSVGconnect({
      paths: [
        { start: ".tool-name:nth-child(1)", end: "#authorize-text", offset: 10, strokeWidth: 1, orientation: "vertical", stroke: "#979797" },
        { start: ".tool-name:nth-child(2)", end: "#authorize-text", offset: 10, strokeWidth: 1, orientation: "vertical", stroke: "#979797" },
        { start: ".tool-name:nth-child(3)", end: "#authorize-text", offset: 10, strokeWidth: 1, orientation: "vertical", stroke: "#979797" },
        { start: ".tool-name:nth-child(4)", end: "#authorize-text", offset: 10, strokeWidth: 1, orientation: "vertical", stroke: "#979797" },
        { start: ".tool-name:nth-child(5)", end: "#authorize-text", offset: 10, strokeWidth: 1, orientation: "vertical", stroke: "#979797" },
        { start: ".tool-name:nth-child(6)", end: "#authorize-text", offset: 10, strokeWidth: 1, orientation: "vertical", stroke: "#979797" },
      ]
    });
    window.requestAnimationFrame(draw_paths);
}
