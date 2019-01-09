var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var jade = require('gulp-jade');
var autoprefixer = require('gulp-autoprefixer');
var imagemin = require('gulp-imagemin');
var imageminPngquant = require('imagemin-pngquant');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');
var realFavicon = require ('gulp-real-favicon');
var fs = require('fs');

var FAVICON_DATA_FILE = 'faviconData.json';

gulp.task('generate-favicon', function(done) {
	realFavicon.generateFavicon({
		masterPicture: 'app/fav/favicon.png',
		dest: 'dist/fav/',
		iconsPath: 'fav',
		design: {
			ios: {
				pictureAspect: 'noChange',
				assets: {
					ios6AndPriorIcons: false,
					ios7AndLaterIcons: false,
					precomposedIcons: false,
					declareOnlyDefaultIcon: true
				}
			},
			desktopBrowser: {},
			windows: {
				pictureAspect: 'noChange',
				backgroundColor: '#da532c',
				onConflict: 'override',
				assets: {
					windows80Ie10Tile: false,
					windows10Ie11EdgeTiles: {
						small: false,
						medium: true,
						big: false,
						rectangle: false
					}
				}
			},
			androidChrome: {
				pictureAspect: 'noChange',
				themeColor: '#ffffff',
				manifest: {
					display: 'standalone',
					orientation: 'notSet',
					onConflict: 'override',
					declared: true
				},
				assets: {
					legacyIcon: false,
					lowResolutionIcons: false
				}
			},
			safariPinnedTab: {
				pictureAspect: 'silhouette',
				themeColor: '#5bbad5'
			}
		},
		settings: {
			scalingAlgorithm: 'Mitchell',
			errorOnImageTooSmall: false,
			readmeFile: false,
			htmlCodeFile: true,
			usePathAsIs: false
		},
		markupFile: FAVICON_DATA_FILE
	}, function() {
		done();
	});
});


gulp.task('inject-favicon-markups', function() {
	return gulp.src('dist/*.html')
		.pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
		.pipe(gulp.dest('dist/'));
});

gulp.task('bs-favicon', function() {
	return gulp.src('./dist/fav/favicon.ico')
		.pipe(gulp.dest('./dist/'));
});

gulp.task('check-for-favicon-update', function(done) {
	var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
	realFavicon.checkForUpdates(currentVersion, function(err) {
		if (err) {
			throw err;
		}
	});
});

gulp.task('favicon', gulp.series('generate-favicon', 'bs-favicon', 'inject-favicon-markups'));

gulp.task('sass', function(){
	return gulp.src('app/sass/**/*.sass')
	.pipe(sass())
	.pipe(autoprefixer({
		browsers: ['last 2 versions'],
		cascade: false
	}))
	.pipe(gulp.dest('dist/css'))
	.pipe(browserSync.reload({stream:true}));
});

gulp.task('img-optimize',function(){
	gulp.src('app/img/*')
	.pipe(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imageminJpegRecompress({
			progressive: true,
			max: 60,
			min: 50
		}),
		imageminPngquant({quality: '60'}),
		imagemin.svgo({plugins: [{removeViewBox: true}]})
		]))
	.pipe(gulp.dest('dist/img/'));
});

gulp.task('jade', function(){
	return gulp.src('app/*.jade')
	.pipe(jade({ pretty: true }))
	.pipe(gulp.dest('dist/'))
});

gulp.task('browser-sync', function(){
	browserSync.init({
		server: {
			baseDir: 'dist',
		},
		notify: false
	});
});

gulp.task('watch', function(){
	gulp.watch('app/sass/**/*.sass', gulp.series('sass'));
	gulp.watch('app/*.jade', gulp.series('jade', 'inject-favicon-markups'));
	gulp.watch('app/img/*', gulp.series('img-optimize')).on('change', function(){
		gulp.series('img-optimize');
	});
	gulp.watch('dist/*.html').on('change', function(){
		browserSync.reload();
	});
});

gulp.task('default', 
	gulp.series(gulp.parallel('sass', 'jade'), 'inject-favicon-markups',
		gulp.parallel('img-optimize', 'browser-sync', 'watch')));