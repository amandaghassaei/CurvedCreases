/**
 * Created by amandaghassaei on 1/20/18.
 */


$(function() {

    var threeView = ThreeView($("#threeContainer"));
    var model3D = Model3D();
    var dynamicSolver = DynamicSolver($("#gpuMathCanvas"));
    var patternImporter = PatternImporter();
    var patternEditor = PatternEditor(model3D, dynamicSolver);

    var optimizing = false;

    threeView.addModel(model3D);

    dynamicSolver.setDamping(0.3);
    model3D.setColorMode("axialStrain");

    patternImporter.loadSVG('assets/Tessellations/reschTriTessellation.svg', {vertexTol: 1.8}, function(){
    // patternImporter.loadSVG('assets/cctests/huffmanTower-facets.svg', {vertexTol: 1.8}, function(){

        var fold = patternImporter.getFold();
        fold = patternImporter.edgesVerticesToVerticesEdges(fold);//need vertices_edges to map vertex movement to all adjacent edges
        window.fold = fold;

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

    $("#startOptimization").click(function(e){
        e.preventDefault();
        optimizing = true;
        $(e.target).hide();
        $("#stopOptimization").show();
    });

    $("#stopOptimization").click(function(e){
        e.preventDefault();
        optimizing = false;
        $(e.target).hide();
        $("#startOptimization").show();
    });

    function loop(){

        if (optimizing){
            var positions = dynamicSolver.capturePositions();
            solve(153, [], dynamicSolver.calcStrain(), positions, window.fold);//start over
            model3D.setFold(window.fold);//this saves a snapshot
            patternEditor.updateSVG(window.fold);
            dynamicSolver.resetToLastState(positions);
            dynamicSolver.updateFoldVerticesCoords(fold.vertices_coords);
            dynamicSolver.stepForward({numSteps: 10});
            var error = dynamicSolver.updateModel3DGeometry(model3D, {colorMode: "axialStrain", strainClip: 5});
            $("#globalStrain").html(error);
            threeView.render();
        } else {
            dynamicSolver.stepForward({numSteps: 100});
            var error = dynamicSolver.updateModel3DGeometry(model3D, {colorMode: "axialStrain", strainClip: 5});
            $("#globalStrain").html(error);
            threeView.render();
        }

        window.requestAnimationFrame(loop);
    }


    var maxStepSize = 0.001;
    function solve(i, evals, currentStrain, positions, fold){

        // if (i>=fold.vertices_coords.length){
        //     return;
        // }

        if (evals.length == 4){

            //calculate step
            var delta = new THREE.Vector2();
            if (evals[0]<currentStrain) {
                delta.x = currentStrain-evals[0];
                if (evals[1]<evals[0]) delta.x = -(currentStrain-evals[1]);
            }
            if (evals[2]<currentStrain) {
                delta.y = currentStrain-evals[2];
                if (evals[3]<evals[2]) delta.y = -(currentStrain-evals[3]);
            }
            if (delta.length() > maxStepSize){
                delta.normalize().multiplyScalar(maxStepSize);//clip to some max step size
            }

            console.log(evals);
            console.log(currentStrain);
            console.log(delta);

            //save changes
            fold.vertices_coords[i] = [fold.vertices_coords[i][0]+delta.x, fold.vertices_coords[i][1], fold.vertices_coords[i][2]+delta.y];
            // return solve(i+1, [], currentStrain, positions, fold);//solve next vertex
            return;
        }

        var vector = new THREE.Vector3(maxStepSize, 0, 0);
        if (evals.length == 1) new THREE.Vector3(-maxStepSize, 0, 0);
        else if (evals.length == 2) vector = new THREE.Vector3(0, 0, maxStepSize);
        else if (evals.length == 3) vector = new THREE.Vector3(0, 0, -maxStepSize);

        var position = [fold.vertices_coords[i][0] + vector.x, 0, fold.vertices_coords[i][2] + vector.z];

        evals.push(dynamicSolver.moveVertAndSolve(i, position, positions, {integrationType: "euler"}));
        solve(i, evals, currentStrain, positions, fold);
    }






});