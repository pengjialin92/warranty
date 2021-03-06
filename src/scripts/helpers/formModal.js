define([
    "jquery",
    "server",
    "skylarkjs",
    "./Partial",
    "toastr",
    "text!./_partials.hbs",
    "handlebars"
], function($, server, skylarkjs, partial, toastr, partialsTpl, handlebars) {
    var langx = skylarkjs.langx;

    function save(name, selector, opt, callback) {
        var action = "create",
            data = {};
        var formData = new FormData();
        selector.find("input").each(function() {
            if (this.type != "file") {
                var s = $(this);
                formData.append(s.attr("name"), s.val());
                data[s.attr("name")] = s.val();
            }
        });
        // data.file = file;
        if (data.id) action = "update";
        //将文件信息追加到其中
        if (opt.file) {
            formData.append('thumbnail', opt.file);
            //利用split切割，拿到上传文件的格式
            var src = opt.file.name,
                formart = src.split(".")[1];
            //使用if判断上传文件格式是否符合
            if (!(formart == "jpg" && formart == "png")) {
                return toastr.error("上传的缩略图只支持jpg或者png格式！");
            }
            delete opt.file;
        }
        for (var key in opt) {
            formData.append(key, opt[key]);
        }

        var url = "/api/" + name + "/" + action;
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var result = JSON.parse(xhr.response || xhr.responseText);
                    if (result.status) {
                        callback(result.result);
                    } else {
                        toastr.error("数据已存在：(" + result.key + ":" + result.value + ")");
                        // selector.modal('hide');
                    }
                } else {
                    toastr.error("系统错误，请联系管理员！");
                    // selector.modal('hide');
                }
            }
        };
        xhr.send(formData);
    };
    var validates = {
        prodNumber: {
            emptyMsg: "产品卷号不能为空",
            numsMsg: "用户名不能少于6位",
            numlMsg: "用户名不能多于14位",
            snMsg: "用户名必须以字母开头",
            validateMsg: "用户名不能包含字符",
            check: function(value) {
                var _us = $("#prodNumber");
                if (!_us.val()) {
                    //     if (value.length < 6) {
                    //         _us.focus();
                    //         return { error: true, msg: this.numsMsg };
                    //     }
                    //     if (value.length > 14) {
                    //         _us.focus();
                    //         return { error: true, msg: this.numlMsg };
                    //     }
                    //     if (!value.match(/^[a-zA-Z0-9]+$/)) {
                    //         _us.focus();
                    //         return { error: true, msg: this.validateMsg };
                    //     }
                    //     if (value.match(/^[^a-zA-Z]/)) {
                    //         _us.focus();
                    //         return { error: true, msg: this.snMsg };
                    //     }
                    // } else {
                    _us.focus();
                    return { error: true, msg: this.emptyMsg };
                }
                return { error: false };
            }
        },
        carNumber: {
            emptyMsg: "车牌号/车架号不能为空",
            check: function(value) {
                var _us = $("#carNumber");
                if (!_us.val()) {
                    _us.focus();
                    return { error: true, msg: this.emptyMsg };
                }
                return { error: false };
            }
        },
        company: {
            emptyMsg: "公司名称不能为空",
            check: function(value) {
                var _us = $("#company");
                if (!_us.val()) {
                    _us.focus();
                    return { error: true, msg: this.emptyMsg };
                }
                return { error: false };
            }
        }
    };

    return {
        files: {},
        _formatPData: function(product) {
            return {
                id: product.id,
                imagePath: product.file ? product.file.path : null,
                modelNum: product.modelNum,
                createdDate: product.createdDate,
                createdAddress: product.createdAddress,
                saleAddress: product.saleAddress,
                prodNumber: product.prodNumber,
                checker: product.checker,
                checkAddress: product.checkAddress
            }
        },
        _formatWData: function(warranty) {
            return {
                id: warranty.id,
                imagePath: warranty.file ? warranty.file.path : null,
                type: warranty.type,
                exeDate: warranty.exeDate,
                shop: warranty.shop,
                carNumber: warranty.carNumber,
                prodNumber: warranty.prodNumber,
                engineer: warranty.engineer,
                proDate: warranty.proDate
            }
        },
        show: function(type, data, callback, prepareData) {
            this.modal = $("#formModal");
            this["show_" + type](data, callback, prepareData);
            this.modal.modal('show');
            return this.modal;
        },

        show_product: function(data, callback) {
            data = this._formatPData(data);
            var self = this,
                modal = this.modal,
                text = data.id ? "编辑产品" : "添加产品";
            partial.get("product-form-partial");
            var prodTpl = handlebars.compile("{{> product-form-partial}}");
            modal.find(".modal-body").html(prodTpl(data));
            modal.find(".modal-title").html(text);
            modal.find(".save-btn").off("click").on("click", function() {
                var result = validates.prodNumber.check();
                if (result.error) {
                    toastr.error(result.msg);
                } else {
                    save("products", modal, {
                        file: self.files.product
                    }, function(product) {
                        self.files.product = null;
                        toastr.success("已保存！");
                        callback(product);
                        modal.modal('hide');
                    });
                }
            });
            modal.find("#prodForm input.thumbnail").on("change", function(e) {
                self.files.product = this.files[0];
            });
        },

        show_warranty: function(data, callback) {
            data = this._formatWData(data);
            var self = this,
                modal = this.modal,
                text = data.id ? "编辑质保" : "添加质保";
            partial.get("warranty-form-partial");
            var warrantyTpl = handlebars.compile("{{> warranty-form-partial}}");
            modal.find(".modal-body").html(warrantyTpl(data));
            modal.find(".modal-title").html(text);
            modal.find(".save-btn").off("click").on("click", function() {
                var result = validates.prodNumber.check();
                if (result.error) {
                    toastr.error(result.msg);
                } else {
                    var result = validates.carNumber.check();
                    if (result.error) {
                        toastr.error(result.msg);
                    } else {
                        save("warranties", modal, {
                            file: self.files.warranty
                        }, function(warranty) {
                            toastr.success("已保存！");
                            self.files.warranty = null;
                            callback(warranty);
                            modal.modal('hide');
                        });
                    }
                }
            });
            modal.find("#wForm input.thumbnail").on("change", function(e) {
                self.files.warranty = this.files[0];
            });
        },



        show_dealer: function(data, callback, prepareData) {
            var self = this,
                modal = this.modal,
                text = data.id ? "编辑经销商" : "添加经销商";
            server().getProvinces().then(function(prepareData) {
                partial.get("dealer-form-partial");
                var dealerTpl = handlebars.compile("{{> dealer-form-partial}}");
                modal.find(".modal-body").html(dealerTpl({
                    provinces: prepareData,
                    dealer: data
                }));
                var _cs = modal.find("#fCityS"),
                    _ps = modal.find("#fProvinceS");
                modal.find("#fProvinceS").on("change", function() {
                    if (!this.value) toastr.warning("请选择省份！");
                    server().getCities(this.value, _cs);
                });
                if (data.id) {
                    _ps.val(data.provinceId);
                    _ps.off('change').on('change', function() {
                        server().getCities(this.value, _cs).then(function() {
                            _cs.val(data.cityId);
                        });
                    });
                    _ps.change();
                }
                modal.find(".modal-title").html(text);
                modal.find(".save-btn").off("click").on("click", function() {
                    var result = validates.company.check();
                    if (result.error) {
                        toastr.error(result.msg);
                    } else {
                        save("dealers", modal, {
                            provinceId: _ps.val(),
                            cityId: _cs.val()
                        }, function(dealer) {
                            toastr.success("已保存！");
                            callback(dealer);
                            modal.modal('hide');
                        });
                    }
                });
            });
        }
    }
});
