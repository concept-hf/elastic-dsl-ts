var gulp = require("gulp"),
    ts = require('gulp-typescript'),
    sourcemaps = require("gulp-sourcemaps")
    merge = require('merge2')
;

var tsFiles = ["src/ElasticDslBuilder/elasticdsl.ts","src/ElasticDslBuilder/elasticdslImpl.ts", "src/ElasticDslBuilder/typings/**/*.d.ts"];

gulp.task('build', function () {
        // Don't bother, typescript modules are still messy :(
    //var tsResult =
    //gulp.src(tsFiles)
    //   // .pipe(sourcemaps.init())
    //  .pipe(ts({
    //      "noImplicitAny": false,
    //      "noEmitHelpers": false,
    //      "noEmitOnError": true,
    //      "removeComments": false,
    //      "noResolve": true,
    //      "sourceMap": true,
    //      "target": "es6",
    //      "declaration": true,
    //      //"amodule": "system",
    //      "outDir": "../../dist/",
    //      "outFile": "elasticdsl.js",
    //      "allowSyntheticDefaultImports": true,
    //      "emitDecoratorMetadata": false,
    //      "experimentalDecorators": false
    //      //,
    //      //"typescript": require('typescript')
    //  }))
    //;//.pipe(sourcemaps.write('.'));
    //return merge([
    //    tsResult.dts.pipe(gulp.dest('../../dist/')),
    //    tsResult.js.pipe(gulp.dest('../../dist/'))
    //])
    //  ;
});
