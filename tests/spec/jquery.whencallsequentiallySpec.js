describe("jQuery When call sequentially", function () {

	var syncCall = function () {
		return $.Deferred().resolve("sync").promise();
	};

	var asyncCall = function () {
		var d = $.Deferred();
		setTimeout(function () {
			d.resolve("async");
		}, 0);
		return d.promise();
	};

	beforeEach(function () {
	});

	it("should return immediately empty array when no calls passed", function () {

		var deferred = $.whenCallSequentially([]);
		expect(deferred.state()).toBe('resolved');
		var data;
		deferred.done(function (res) {
			data = res;
		});
		expect(data).toEqual([]);
	});

	it("should return immediately with data when synchronous call passed", function () {

		var deferred = $.whenCallSequentially([syncCall]);
		expect(deferred.state()).toBe('resolved');
		var data;
		deferred.done(function (res) {
			data = res;
		});
		expect(data).toEqual(['sync']);
	});

	it("should return immediately with data when multiple synchronous call passed", function () {

		var deferred = $.whenCallSequentially([syncCall, syncCall, syncCall]);
		expect(deferred.state()).toBe('resolved');
		var data;
		deferred.done(function (res) {
			data = res;
		});
		expect(data).toEqual(['sync', 'sync', 'sync']);
	});

	it("should execute one async job", function () {

		var deferred = $.whenCallSequentially([asyncCall]);
		expect(deferred.state()).toEqual('pending');

		waitsFor(function () {
			return deferred.state() === 'resolved';
		}, "wait for data extraction", 5000);

		runs(function () {

			var data;
			deferred.done(function (res) {
				data = res;
			});
			expect(data).toEqual(['async']);
		});
	});

	it("should execute multiple async jobs", function () {

		var deferred = $.whenCallSequentially([asyncCall, asyncCall, asyncCall]);
		expect(deferred.state()).toEqual('pending');

		waitsFor(function () {
			return deferred.state() === 'resolved';
		}, "wait for data extraction", 5000);

		runs(function () {

			var data;
			deferred.done(function (res) {
				data = res;
			});
			expect(data).toEqual(['async', 'async', 'async']);
		});
	});

	it("should execute multiple sync and async jobs", function () {

		var deferred = $.whenCallSequentially([syncCall, syncCall, asyncCall, asyncCall, syncCall, asyncCall]);
		expect(deferred.state()).toEqual('pending');

		waitsFor(function () {
			return deferred.state() === 'resolved';
		}, "wait for data extraction", 5000);

		runs(function () {

			var data;
			deferred.done(function (res) {
				data = res;
			});
			expect(data).toEqual(['sync', 'sync', 'async', 'async', 'sync', 'async']);
		});
	});
});