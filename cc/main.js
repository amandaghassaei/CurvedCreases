/**
 * Created by amandaghassaei on 1/20/18.
 */


$(function() {

    var threeView = ThreeView($("#threeContainer"));
    var model3D = Model3D();
    var dynamicSolver = DynamicSolver($("#gpuMathCanvas"));
    var patternImporter = PatternImporter();
    var patternEditor = PatternEditor(model3D, dynamicSolver);

    threeView.addModel(model3D);

    // dynamicSolver.setDamping(0.1);
    model3D.setColorMode("axialStrain");

    patternImporter.loadSVG('assets/cctests/huffmanTower-facets.svg', {vertexTol: 1.8}, function(){

        var fold = patternImporter.getFold();
        fold = patternImporter.edgesVerticesToVerticesEdges(fold);//need vertices_edges to map vertex movement to all adjacent edges

        patternEditor.draw(fold);
        model3D.setFold(fold);
        dynamicSolver.setFold(fold);

        model3D.setFacetVisiblity(true);

        window.requestAnimationFrame(loop);

    });

    $(window).resize(function(){
        threeView.onWindowResize();
        patternEditor.onWindowResize();
    });

    function loop(){

        dynamicSolver.stepForward({numSteps: 100});
        dynamicSolver.updateModel3DGeometry(model3D, {colorMode: "axialStrain", strainClip: 5});
        threeView.render();

        window.requestAnimationFrame(loop);
    }






});