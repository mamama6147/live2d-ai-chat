var Live2DCubismFramework = (() => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  
    // src/live2dcubismframework.ts
    var live2dcubismframework_exports = {};
    __export(live2dcubismframework_exports, {
      Constant: () => Constant,
      CubismFramework: () => CubismFramework,
      Live2DCubismFramework: () => Live2DCubismFramework11,
      LogLevel: () => LogLevel,
      Option: () => Option,
      csmDelete: () => csmDelete,
      strtod: () => strtod
    });
  
    // src/type/csmvector.ts
    var csmVector = class _csmVector {
      /**
       * 引数付きコンストラクタ
       * @param iniitalCapacity 初期化後のキャパシティ。データサイズは_capacity * sizeof(T)
       * @param zeroClear trueなら初期化時に確保した領域を0で埋める
       */
      constructor(initialCapacity = 0) {
        if (initialCapacity < 1) {
          this._ptr = [];
          this._capacity = 0;
          this._size = 0;
        } else {
          this._ptr = new Array(initialCapacity);
          this._capacity = initialCapacity;
          this._size = 0;
        }
      }
      /**
       * インデックスで指定した要素を返す
       */
      at(index) {
        return this._ptr[index];
      }
      /**
       * 要素をセット
       * @param index 要素をセットするインデックス
       * @param value セットする要素
       */
      set(index, value) {
        this._ptr[index] = value;
      }
      /**
       * コンテナを取得する
       */
      get(offset = 0) {
        const ret = new Array();
        for (let i = offset; i < this._size; i++) {
          ret.push(this._ptr[i]);
        }
        return ret;
      }
      /**
       * pushBack処理、コンテナに新たな要素を追加する
       * @param value PushBack処理で追加する値
       */
      pushBack(value) {
        if (this._size >= this._capacity) {
          this.prepareCapacity(
            this._capacity == 0 ? _csmVector.DefaultSize : this._capacity * 2
          );
        }
        this._ptr[this._size++] = value;
      }
      /**
       * コンテナの全要素を解放する
       */
      clear() {
        this._ptr.length = 0;
        this._size = 0;
      }
      /**
       * コンテナの要素数を返す
       * @return コンテナの要素数
       */
      getSize() {
        return this._size;
      }
      /**
       * コンテナの全要素に対して代入処理を行う
       * @param newSize 代入処理後のサイズ
       * @param value 要素に代入する値
       */
      assign(newSize, value) {
        const curSize = this._size;
        if (curSize < newSize) {
          this.prepareCapacity(newSize);
        }
        for (let i = 0; i < newSize; i++) {
          this._ptr[i] = value;
        }
        this._size = newSize;
      }
      /**
       * サイズ変更
       */
      resize(newSize, value = null) {
        this.updateSize(newSize, value, true);
      }
      /**
       * サイズ変更
       */
      updateSize(newSize, value = null, callPlacementNew = true) {
        const curSize = this._size;
        if (curSize < newSize) {
          this.prepareCapacity(newSize);
          if (callPlacementNew) {
            for (let i = this._size; i < newSize; i++) {
              if (typeof value == "function") {
                this._ptr[i] = JSON.parse(JSON.stringify(new value()));
              } else {
                this._ptr[i] = value;
              }
            }
          } else {
            for (let i = this._size; i < newSize; i++) {
              this._ptr[i] = value;
            }
          }
        } else {
          const sub = this._size - newSize;
          this._ptr.splice(this._size - sub, sub);
        }
        this._size = newSize;
      }
      /**
       * コンテナにコンテナ要素を挿入する
       * @param position 挿入する位置
       * @param begin 挿入するコンテナの開始位置
       * @param end 挿入するコンテナの終端位置
       */
      insert(position, begin, end) {
        let dstSi = position._index;
        const srcSi = begin._index;
        const srcEi = end._index;
        const addCount = srcEi - srcSi;
        this.prepareCapacity(this._size + addCount);
        const addSize = this._size - dstSi;
        if (addSize > 0) {
          for (let i = 0; i < addSize; i++) {
            this._ptr.splice(dstSi + i, 0, null);
          }
        }
        for (let i = srcSi; i < srcEi; i++, dstSi++) {
          this._ptr[dstSi] = begin._vector._ptr[i];
        }
        this._size = this._size + addCount;
      }
      /**
       * コンテナからインデックスで指定した要素を削除する
       * @param index インデックス値
       * @return true 削除実行
       * @return false 削除範囲外
       */
      remove(index) {
        if (index < 0 || this._size <= index) {
          return false;
        }
        this._ptr.splice(index, 1);
        --this._size;
        return true;
      }
      /**
       * コンテナから要素を削除して他の要素をシフトする
       * @param ite 削除する要素
       */
      erase(ite) {
        const index = ite._index;
        if (index < 0 || this._size <= index) {
          return ite;
        }
        this._ptr.splice(index, 1);
        --this._size;
        const ite2 = new iterator(this, index);
        return ite2;
      }
      /**
       * コンテナのキャパシティを確保する
       * @param newSize 新たなキャパシティ。引数の値が現在のサイズ未満の場合は何もしない.
       */
      prepareCapacity(newSize) {
        if (newSize > this._capacity) {
          if (this._capacity == 0) {
            this._ptr = new Array(newSize);
            this._capacity = newSize;
          } else {
            this._ptr.length = newSize;
            this._capacity = newSize;
          }
        }
      }
      /**
       * コンテナの先頭要素を返す
       */
      begin() {
        const ite = this._size == 0 ? this.end() : new iterator(this, 0);
        return ite;
      }
      /**
       * コンテナの終端要素を返す
       */
      end() {
        const ite = new iterator(this, this._size);
        return ite;
      }
      getOffset(offset) {
        const newVector = new _csmVector();
        newVector._ptr = this.get(offset);
        newVector._size = this.get(offset).length;
        newVector._capacity = this.get(offset).length;
        return newVector;
      }
      static {
        // コンテナのキャパシティ
        this.DefaultSize = 10;
      }
      // コンテナ初期化のデフォルトサイズ
    };
    var iterator = class _iterator {
      /**
       * コンストラクタ
       */
      constructor(v, index) {
        this._vector = v != void 0 ? v : null;
        this._index = index != void 0 ? index : 0;
      }
      /**
       * 代入
       */
      set(ite) {
        this._index = ite._index;
        this._vector = ite._vector;
        return this;
      }
      /**
       * 前置き++演算
       */
      preIncrement() {
        ++this._index;
        return this;
      }
      /**
       * 前置き--演算
       */
      preDecrement() {
        --this._index;
        return this;
      }
      /**
       * 後置き++演算子
       */
      increment() {
        const iteold = new _iterator(this._vector, this._index++);
        return iteold;
      }
      /**
       * 後置き--演算子
       */
      decrement() {
        const iteold = new _iterator(this._vector, this._index--);
        return iteold;
      }
      /**
       * ptr
       */
      ptr() {
        return this._vector._ptr[this._index];
      }
      /**
       * =演算子のオーバーロード
       */
      substitution(ite) {
        this._index = ite._index;
        this._vector = ite._vector;
        return this;
      }
      /**
       * !=演算子のオーバーロード
       */
      notEqual(ite) {
        return this._index != ite._index || this._vector != ite._vector;
      }
      // コンテナ
    };
    var Live2DCubismFramework;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.csmVector = csmVector;
      Live2DCubismFramework12.iterator = iterator;
    })(Live2DCubismFramework || (Live2DCubismFramework = {}));
  
    // src/type/csmstring.ts
    var csmString = class {
      /**
       * 文字列を後方に追加する
       *
       * @param c 追加する文字列
       * @return 更新された文字列
       */
      append(c, length) {
        this.s += length !== void 0 ? c.substr(0, length) : c;
        return this;
      }
      /**
       * 文字サイズを拡張して文字を埋める
       * @param length    拡張する文字数
       * @param v         埋める文字
       * @return 更新された文字列
       */
      expansion(length, v) {
        for (let i = 0; i < length; i++) {
          this.append(v);
        }
        return this;
      }
      /**
       * 文字列の長さをバイト数で取得する
       */
      getBytes() {
        return encodeURIComponent(this.s).replace(/%../g, "x").length;
      }
      /**
       * 文字列の長さを返す
       */
      getLength() {
        return this.s.length;
      }
      /**
       * 文字列比較 <
       * @param s 比較する文字列
       * @return true:    比較する文字列より小さい
       * @return false:   比較する文字列より大きい
       */
      isLess(s) {
        return this.s < s.s;
      }
      /**
       * 文字列比較 >
       * @param s 比較する文字列
       * @return true:    比較する文字列より大きい
       * @return false:   比較する文字列より小さい
       */
      isGreat(s) {
        return this.s > s.s;
      }
      /**
       * 文字列比較 ==
       * @param s 比較する文字列
       * @return true:    比較する文字列と等しい
       * @return false:   比較する文字列と異なる
       */
      isEqual(s) {
        return this.s == s;
      }
      /**
       * 文字列が空かどうか
       * @return true: 空の文字列
       * @return false: 値が設定されている
       */
      isEmpty() {
        return this.s.length == 0;
      }
      /**
       * 引数付きコンストラクタ
       */
      constructor(s) {
        this.s = s;
      }
    };
    var Live2DCubismFramework2;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.csmString = csmString;
    })(Live2DCubismFramework2 || (Live2DCubismFramework2 = {}));
  
    // src/id/cubismid.ts
    var CubismId = class _CubismId {
      /**
       * 内部で使用するCubismIdクラス生成メソッド
       *
       * @param id ID文字列
       * @returns CubismId
       * @note 指定したID文字列からCubismIdを取得する際は
       *       CubismIdManager().getId(id)を使用してください
       */
      static createIdInternal(id) {
        return new _CubismId(id);
      }
      /**
       * ID名を取得する
       */
      getString() {
        return this._id;
      }
      /**
       * idを比較
       * @param c 比較するid
       * @return 同じならばtrue,異なっていればfalseを返す
       */
      isEqual(c) {
        if (typeof c === "string") {
          return this._id.isEqual(c);
        } else if (c instanceof csmString) {
          return this._id.isEqual(c.s);
        } else if (c instanceof _CubismId) {
          return this._id.isEqual(c._id.s);
        }
        return false;
      }
      /**
       * idを比較
       * @param c 比較するid
       * @return 同じならばtrue,異なっていればfalseを返す
       */
      isNotEqual(c) {
        if (typeof c == "string") {
          return !this._id.isEqual(c);
        } else if (c instanceof csmString) {
          return !this._id.isEqual(c.s);
        } else if (c instanceof _CubismId) {
          return !this._id.isEqual(c._id.s);
        }
        return false;
      }
      /**
       * プライベートコンストラクタ
       *
       * @note ユーザーによる生成は許可しません
       */
      constructor(id) {
        if (typeof id === "string") {
          this._id = new csmString(id);
          return;
        }
        this._id = id;
      }
      // ID名
    };
    var Live2DCubismFramework3;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.CubismId = CubismId;
    })(Live2DCubismFramework3 || (Live2DCubismFramework3 = {}));
  
    // src/id/cubismidmanager.ts
    var CubismIdManager = class {
      /**
       * コンストラクタ
       */
      constructor() {
        this._ids = new csmVector();
      }
      /**
       * デストラクタ相当の処理
       */
      release() {
        for (let i = 0; i < this._ids.getSize(); ++i) {
          this._ids.set(i, void 0);
        }
        this._ids = null;
      }
      /**
       * ID名をリストから登録
       *
       * @param ids ID名リスト
       * @param count IDの個数
       */
      registerIds(ids) {
        for (let i = 0; i < ids.length; i++) {
          this.registerId(ids[i]);
        }
      }
      /**
       * ID名を登録
       *
       * @param id ID名
       */
      registerId(id) {
        let result = null;
        if ("string" == typeof id) {
          if ((result = this.findId(id)) != null) {
            return result;
          }
          result = CubismId.createIdInternal(id);
          this._ids.pushBack(result);
        } else {
          return this.registerId(id.s);
        }
        return result;
      }
      /**
       * ID名からIDを取得する
       *
       * @param id ID名
       */
      getId(id) {
        return this.registerId(id);
      }
      /**
       * ID名からIDの確認
       *
       * @return true 存在する
       * @return false 存在しない
       */
      isExist(id) {
        if ("string" == typeof id) {
          return this.findId(id) != null;
        }
        return this.isExist(id.s);
      }
      /**
       * ID名からIDを検索する。
       *
       * @param id ID名
       * @return 登録されているID。なければNULL。
       */
      findId(id) {
        for (let i = 0; i < this._ids.getSize(); ++i) {
          if (this._ids.at(i).getString().isEqual(id)) {
            return this._ids.at(i);
          }
        }
        return null;
      }
      // 登録されているIDのリスト
    };
    var Live2DCubismFramework4;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.CubismIdManager = CubismIdManager;
    })(Live2DCubismFramework4 || (Live2DCubismFramework4 = {}));
  
    // src/math/cubismmatrix44.ts
    var CubismMatrix44 = class _CubismMatrix44 {
      /**
       * コンストラクタ
       */
      constructor() {
        this._tr = new Float32Array(16);
        this.loadIdentity();
      }
      /**
       * 受け取った２つの行列の乗算を行う。
       *
       * @param a 行列a
       * @param b 行列b
       * @return 乗算結果の行列
       */
      static multiply(a, b, dst) {
        const c = new Float32Array([
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]);
        const n = 4;
        for (let i = 0; i < n; ++i) {
          for (let j = 0; j < n; ++j) {
            for (let k = 0; k < n; ++k) {
              c[j + i * 4] += a[k + i * 4] * b[j + k * 4];
            }
          }
        }
        for (let i = 0; i < 16; ++i) {
          dst[i] = c[i];
        }
      }
      /**
       * 単位行列に初期化する
       */
      loadIdentity() {
        const c = new Float32Array([
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ]);
        this.setMatrix(c);
      }
      /**
       * 行列を設定
       *
       * @param tr 16個の浮動小数点数で表される4x4の行列
       */
      setMatrix(tr) {
        for (let i = 0; i < 16; ++i) {
          this._tr[i] = tr[i];
        }
      }
      /**
       * 行列を浮動小数点数の配列で取得
       *
       * @return 16個の浮動小数点数で表される4x4の行列
       */
      getArray() {
        return this._tr;
      }
      /**
       * X軸の拡大率を取得
       * @return X軸の拡大率
       */
      getScaleX() {
        return this._tr[0];
      }
      /**
       * Y軸の拡大率を取得する
       *
       * @return Y軸の拡大率
       */
      getScaleY() {
        return this._tr[5];
      }
      /**
       * X軸の移動量を取得
       * @return X軸の移動量
       */
      getTranslateX() {
        return this._tr[12];
      }
      /**
       * Y軸の移動量を取得
       * @return Y軸の移動量
       */
      getTranslateY() {
        return this._tr[13];
      }
      /**
       * X軸の値を現在の行列で計算
       *
       * @param src X軸の値
       * @return 現在の行列で計算されたX軸の値
       */
      transformX(src) {
        return this._tr[0] * src + this._tr[12];
      }
      /**
       * Y軸の値を現在の行列で計算
       *
       * @param src Y軸の値
       * @return 現在の行列で計算されたY軸の値
       */
      transformY(src) {
        return this._tr[5] * src + this._tr[13];
      }
      /**
       * X軸の値を現在の行列で逆計算
       */
      invertTransformX(src) {
        return (src - this._tr[12]) / this._tr[0];
      }
      /**
       * Y軸の値を現在の行列で逆計算
       */
      invertTransformY(src) {
        return (src - this._tr[13]) / this._tr[5];
      }
      /**
       * 現在の行列の位置を起点にして移動
       *
       * 現在の行列の位置を起点にして相対的に移動する。
       *
       * @param x X軸の移動量
       * @param y Y軸の移動量
       */
      translateRelative(x, y) {
        const tr1 = new Float32Array([
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          x,
          y,
          0,
          1
        ]);
        _CubismMatrix44.multiply(tr1, this._tr, this._tr);
      }
      /**
       * 現在の行列の位置を移動
       *
       * 現在の行列の位置を指定した位置へ移動する
       *
       * @param x X軸の移動量
       * @param y y軸の移動量
       */
      translate(x, y) {
        this._tr[12] = x;
        this._tr[13] = y;
      }
      /**
       * 現在の行列のX軸の位置を指定した位置へ移動する
       *
       * @param x X軸の移動量
       */
      translateX(x) {
        this._tr[12] = x;
      }
      /**
       * 現在の行列のY軸の位置を指定した位置へ移動する
       *
       * @param y Y軸の移動量
       */
      translateY(y) {
        this._tr[13] = y;
      }
      /**
       * 現在の行列の拡大率を相対的に設定する
       *
       * @param x X軸の拡大率
       * @param y Y軸の拡大率
       */
      scaleRelative(x, y) {
        const tr1 = new Float32Array([
          x,
          0,
          0,
          0,
          0,
          y,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ]);
        _CubismMatrix44.multiply(tr1, this._tr, this._tr);
      }
      /**
       * 現在の行列の拡大率を指定した倍率に設定する
       *
       * @param x X軸の拡大率
       * @param y Y軸の拡大率
       */
      scale(x, y) {
        this._tr[0] = x;
        this._tr[5] = y;
      }
      /**
       * 引数で与えられた行列にこの行列を乗算する。
       * (引数で与えられた行列) * (この行列)
       *
       * @note 関数名と実際の計算内容に乖離があるため、今後計算順が修正される可能性があります。
       * @param m 行列
       */
      multiplyByMatrix(m) {
        _CubismMatrix44.multiply(m.getArray(), this._tr, this._tr);
      }
      /**
       * オブジェクトのコピーを生成する
       */
      clone() {
        const cloneMatrix = new _CubismMatrix44();
        for (let i = 0; i < this._tr.length; i++) {
          cloneMatrix._tr[i] = this._tr[i];
        }
        return cloneMatrix;
      }
      // 4x4行列データ
    };
    var Live2DCubismFramework5;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.CubismMatrix44 = CubismMatrix44;
    })(Live2DCubismFramework5 || (Live2DCubismFramework5 = {}));
  
    // src/type/csmrectf.ts
    var csmRect = class {
      /**
       * コンストラクタ
       * @param x 左端X座標
       * @param y 上端Y座標
       * @param w 幅
       * @param h 高さ
       */
      constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
      }
      /**
       * 矩形中央のX座標を取得する
       */
      getCenterX() {
        return this.x + 0.5 * this.width;
      }
      /**
       * 矩形中央のY座標を取得する
       */
      getCenterY() {
        return this.y + 0.5 * this.height;
      }
      /**
       * 右側のX座標を取得する
       */
      getRight() {
        return this.x + this.width;
      }
      /**
       * 下端のY座標を取得する
       */
      getBottom() {
        return this.y + this.height;
      }
      /**
       * 矩形に値をセットする
       * @param r 矩形のインスタンス
       */
      setRect(r) {
        this.x = r.x;
        this.y = r.y;
        this.width = r.width;
        this.height = r.height;
      }
      /**
       * 矩形中央を軸にして縦横を拡縮する
       * @param w 幅方向に拡縮する量
       * @param h 高さ方向に拡縮する量
       */
      expand(w, h) {
        this.x -= w;
        this.y -= h;
        this.width += w * 2;
        this.height += h * 2;
      }
      // 高さ
    };
    var Live2DCubismFramework6;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.csmRect = csmRect;
    })(Live2DCubismFramework6 || (Live2DCubismFramework6 = {}));
  
    // src/rendering/cubismrenderer.ts
    var CubismRenderer = class {
      /**
       * レンダラのインスタンスを生成して取得する
       *
       * @return レンダラのインスタンス
       */
      static create() {
        return null;
      }
      /**
       * レンダラのインスタンスを解放する
       */
      static delete(renderer) {
        renderer = null;
      }
      /**
       * レンダラの初期化処理を実行する
       * 引数に渡したモデルからレンダラの初期化処理に必要な情報を取り出すことができる
       * @param model モデルのインスタンス
       */
      initialize(model) {
        this._model = model;
      }
      /**
       * モデルを描画する
       */
      drawModel() {
        if (this.getModel() == null) return;
        this.saveProfile();
        this.doDrawModel();
        this.restoreProfile();
      }
      /**
       * Model-View-Projection 行列をセットする
       * 配列は複製されるので、元の配列は外で破棄して良い
       * @param matrix44 Model-View-Projection 行列
       */
      setMvpMatrix(matrix44) {
        this._mvpMatrix4x4.setMatrix(matrix44.getArray());
      }
      /**
       * Model-View-Projection 行列を取得する
       * @return Model-View-Projection 行列
       */
      getMvpMatrix() {
        return this._mvpMatrix4x4;
      }
      /**
       * モデルの色をセットする
       * 各色0.0~1.0の間で指定する（1.0が標準の状態）
       * @param red 赤チャンネルの値
       * @param green 緑チャンネルの値
       * @param blue 青チャンネルの値
       * @param alpha αチャンネルの値
       */
      setModelColor(red, green, blue, alpha) {
        if (red < 0) {
          red = 0;
        } else if (red > 1) {
          red = 1;
        }
        if (green < 0) {
          green = 0;
        } else if (green > 1) {
          green = 1;
        }
        if (blue < 0) {
          blue = 0;
        } else if (blue > 1) {
          blue = 1;
        }
        if (alpha < 0) {
          alpha = 0;
        } else if (alpha > 1) {
          alpha = 1;
        }
        this._modelColor.r = red;
        this._modelColor.g = green;
        this._modelColor.b = blue;
        this._modelColor.a = alpha;
      }
      /**
       * モデルの色を取得する
       * 各色0.0~1.0の間で指定する(1.0が標準の状態)
       *
       * @return RGBAのカラー情報
       */
      getModelColor() {
        return JSON.parse(JSON.stringify(this._modelColor));
      }
      /**
       * 透明度を考慮したモデルの色を計算する。
       *
       * @param opacity 透明度
       *
       * @return RGBAのカラー情報
       */
      getModelColorWithOpacity(opacity) {
        const modelColorRGBA = this.getModelColor();
        modelColorRGBA.a *= opacity;
        if (this.isPremultipliedAlpha()) {
          modelColorRGBA.r *= modelColorRGBA.a;
          modelColorRGBA.g *= modelColorRGBA.a;
          modelColorRGBA.b *= modelColorRGBA.a;
        }
        return modelColorRGBA;
      }
      /**
       * 乗算済みαの有効・無効をセットする
       * 有効にするならtrue、無効にするならfalseをセットする
       */
      setIsPremultipliedAlpha(enable) {
        this._isPremultipliedAlpha = enable;
      }
      /**
       * 乗算済みαの有効・無効を取得する
       * @return true 乗算済みのα有効
       * @return false 乗算済みのα無効
       */
      isPremultipliedAlpha() {
        return this._isPremultipliedAlpha;
      }
      /**
       * カリング（片面描画）の有効・無効をセットする。
       * 有効にするならtrue、無効にするならfalseをセットする
       */
      setIsCulling(culling) {
        this._isCulling = culling;
      }
      /**
       * カリング（片面描画）の有効・無効を取得する。
       * @return true カリング有効
       * @return false カリング無効
       */
      isCulling() {
        return this._isCulling;
      }
      /**
       * テクスチャの異方性フィルタリングのパラメータをセットする
       * パラメータ値の影響度はレンダラの実装に依存する
       * @param n パラメータの値
       */
      setAnisotropy(n) {
        this._anisotropy = n;
      }
      /**
       * テクスチャの異方性フィルタリングのパラメータをセットする
       * @return 異方性フィルタリングのパラメータ
       */
      getAnisotropy() {
        return this._anisotropy;
      }
      /**
       * レンダリングするモデルを取得する
       * @return レンダリングするモデル
       */
      getModel() {
        return this._model;
      }
      /**
       * マスク描画の方式を変更する。
       * falseの場合、マスクを1枚のテクスチャに分割してレンダリングする（デフォルト）
       * 高速だが、マスク個数の上限が36に限定され、質も荒くなる
       * trueの場合、パーツ描画の前にその都度必要なマスクを描き直す
       * レンダリング品質は高いが描画処理負荷は増す
       * @param high 高精細マスクに切り替えるか？
       */
      useHighPrecisionMask(high) {
        this._useHighPrecisionMask = high;
      }
      /**
       * マスクの描画方式を取得する
       * @return true 高精細方式
       * @return false デフォルト
       */
      isUsingHighPrecisionMask() {
        return this._useHighPrecisionMask;
      }
      /**
       * コンストラクタ
       */
      constructor() {
        this._isCulling = false;
        this._isPremultipliedAlpha = false;
        this._anisotropy = 0;
        this._model = null;
        this._modelColor = new CubismTextureColor();
        this._useHighPrecisionMask = false;
        this._mvpMatrix4x4 = new CubismMatrix44();
        this._mvpMatrix4x4.loadIdentity();
      }
      // falseの場合、マスクを纏めて描画する trueの場合、マスクはパーツ描画ごとに書き直す
    };
    var CubismBlendMode = /* @__PURE__ */ ((CubismBlendMode2) => {
      CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Normal"] = 0] = "CubismBlendMode_Normal";
      CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Additive"] = 1] = "CubismBlendMode_Additive";
      CubismBlendMode2[CubismBlendMode2["CubismBlendMode_Multiplicative"] = 2] = "CubismBlendMode_Multiplicative";
      return CubismBlendMode2;
    })(CubismBlendMode || {});
    var CubismTextureColor = class {
      /**
       * コンストラクタ
       */
      constructor(r = 1, g = 1, b = 1, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
      }
      // αチャンネル
    };
    var Live2DCubismFramework7;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.CubismBlendMode = CubismBlendMode;
      Live2DCubismFramework12.CubismRenderer = CubismRenderer;
      Live2DCubismFramework12.CubismTextureColor = CubismTextureColor;
    })(Live2DCubismFramework7 || (Live2DCubismFramework7 = {}));
  
    // src/cubismframeworkconfig.ts
    var CSM_LOG_LEVEL_VERBOSE = 0;
    var CSM_LOG_LEVEL_DEBUG = 1;
    var CSM_LOG_LEVEL_INFO = 2;
    var CSM_LOG_LEVEL_WARNING = 3;
    var CSM_LOG_LEVEL_ERROR = 4;
    var CSM_LOG_LEVEL = CSM_LOG_LEVEL_VERBOSE;
  
    // src/utils/cubismdebug.ts
    var CubismLogPrint = (level, fmt, args) => {
      CubismDebug.print(level, "[CSM]" + fmt, args);
    };
    var CubismLogPrintIn = (level, fmt, args) => {
      CubismLogPrint(level, fmt + "\n", args);
    };
    var CSM_ASSERT = (expr) => {
      console.assert(expr);
    };
    var CubismLogVerbose;
    var CubismLogDebug;
    var CubismLogInfo;
    var CubismLogWarning;
    var CubismLogError;
    if (CSM_LOG_LEVEL <= CSM_LOG_LEVEL_VERBOSE) {
      CubismLogVerbose = (fmt, ...args) => {
        CubismLogPrintIn(0 /* LogLevel_Verbose */, "[V]" + fmt, args);
      };
      CubismLogDebug = (fmt, ...args) => {
        CubismLogPrintIn(1 /* LogLevel_Debug */, "[D]" + fmt, args);
      };
      CubismLogInfo = (fmt, ...args) => {
        CubismLogPrintIn(2 /* LogLevel_Info */, "[I]" + fmt, args);
      };
      CubismLogWarning = (fmt, ...args) => {
        CubismLogPrintIn(3 /* LogLevel_Warning */, "[W]" + fmt, args);
      };
      CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(4 /* LogLevel_Error */, "[E]" + fmt, args);
      };
    } else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_DEBUG) {
      CubismLogDebug = (fmt, ...args) => {
        CubismLogPrintIn(1 /* LogLevel_Debug */, "[D]" + fmt, args);
      };
      CubismLogInfo = (fmt, ...args) => {
        CubismLogPrintIn(2 /* LogLevel_Info */, "[I]" + fmt, args);
      };
      CubismLogWarning = (fmt, ...args) => {
        CubismLogPrintIn(3 /* LogLevel_Warning */, "[W]" + fmt, args);
      };
      CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(4 /* LogLevel_Error */, "[E]" + fmt, args);
      };
    } else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_INFO) {
      CubismLogInfo = (fmt, ...args) => {
        CubismLogPrintIn(2 /* LogLevel_Info */, "[I]" + fmt, args);
      };
      CubismLogWarning = (fmt, ...args) => {
        CubismLogPrintIn(3 /* LogLevel_Warning */, "[W]" + fmt, args);
      };
      CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(4 /* LogLevel_Error */, "[E]" + fmt, args);
      };
    } else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_WARNING) {
      CubismLogWarning = (fmt, ...args) => {
        CubismLogPrintIn(3 /* LogLevel_Warning */, "[W]" + fmt, args);
      };
      CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(4 /* LogLevel_Error */, "[E]" + fmt, args);
      };
    } else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_ERROR) {
      CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(4 /* LogLevel_Error */, "[E]" + fmt, args);
      };
    }
    var CubismDebug = class {
      /**
       * ログを出力する。第一引数にログレベルを設定する。
       * CubismFramework.initialize()時にオプションで設定されたログ出力レベルを下回る場合はログに出さない。
       *
       * @param logLevel ログレベルの設定
       * @param format 書式付き文字列
       * @param args 可変長引数
       */
      static print(logLevel, format, args) {
        if (logLevel < CubismFramework.getLoggingLevel()) {
          return;
        }
        const logPrint = CubismFramework.coreLogFunction;
        if (!logPrint) return;
        const buffer = format.replace(/\{(\d+)\}/g, (m, k) => {
          return args[k];
        });
        logPrint(buffer);
      }
      /**
       * データから指定した長さだけダンプ出力する。
       * CubismFramework.initialize()時にオプションで設定されたログ出力レベルを下回る場合はログに出さない。
       *
       * @param logLevel ログレベルの設定
       * @param data ダンプするデータ
       * @param length ダンプする長さ
       */
      static dumpBytes(logLevel, data, length) {
        for (let i = 0; i < length; i++) {
          if (i % 16 == 0 && i > 0) this.print(logLevel, "\n");
          else if (i % 8 == 0 && i > 0) this.print(logLevel, "  ");
          this.print(logLevel, "{0} ", [data[i] & 255]);
        }
        this.print(logLevel, "\n");
      }
      /**
       * private コンストラクタ
       */
      constructor() {
      }
    };
    var Live2DCubismFramework8;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.CubismDebug = CubismDebug;
    })(Live2DCubismFramework8 || (Live2DCubismFramework8 = {}));
  
    // src/type/csmmap.ts
    var csmPair = class {
      /**
       * コンストラクタ
       * @param key Keyとしてセットする値
       * @param value Valueとしてセットする値
       */
      constructor(key, value) {
        this.first = key == void 0 ? null : key;
        this.second = value == void 0 ? null : value;
      }
      // valueとして用いる変数
    };
    var csmMap = class _csmMap {
      /**
       * 引数付きコンストラクタ
       * @param size 初期化時点で確保するサイズ
       */
      constructor(size) {
        if (size != void 0) {
          if (size < 1) {
            this._keyValues = [];
            this._dummyValue = null;
            this._size = 0;
          } else {
            this._keyValues = new Array(size);
            this._size = size;
          }
        } else {
          this._keyValues = [];
          this._dummyValue = null;
          this._size = 0;
        }
      }
      /**
       * デストラクタ
       */
      release() {
        this.clear();
      }
      /**
       * キーを追加する
       * @param key 新たに追加するキー
       */
      appendKey(key) {
        let findIndex = -1;
        for (let i = 0; i < this._size; i++) {
          if (this._keyValues[i].first == key) {
            findIndex = i;
            break;
          }
        }
        if (findIndex != -1) {
          CubismLogWarning("The key `{0}` is already append.", key);
          return;
        }
        this.prepareCapacity(this._size + 1, false);
        this._keyValues[this._size] = new csmPair(key);
        this._size += 1;
      }
      /**
       * 添字演算子[key]のオーバーロード(get)
       * @param key 添字から特定されるValue値
       */
      getValue(key) {
        let found = -1;
        for (let i = 0; i < this._size; i++) {
          if (this._keyValues[i].first == key) {
            found = i;
            break;
          }
        }
        if (found >= 0) {
          return this._keyValues[found].second;
        } else {
          this.appendKey(key);
          return this._keyValues[this._size - 1].second;
        }
      }
      /**
       * 添字演算子[key]のオーバーロード(set)
       * @param key 添字から特定されるValue値
       * @param value 代入するValue値
       */
      setValue(key, value) {
        let found = -1;
        for (let i = 0; i < this._size; i++) {
          if (this._keyValues[i].first == key) {
            found = i;
            break;
          }
        }
        if (found >= 0) {
          this._keyValues[found].second = value;
        } else {
          this.appendKey(key);
          this._keyValues[this._size - 1].second = value;
        }
      }
      /**
       * 引数で渡したKeyを持つ要素が存在するか
       * @param key 存在を確認するkey
       * @return true 引数で渡したkeyを持つ要素が存在する
       * @return false 引数で渡したkeyを持つ要素が存在しない
       */
      isExist(key) {
        for (let i = 0; i < this._size; i++) {
          if (this._keyValues[i].first == key) {
            return true;
          }
        }
        return false;
      }
      /**
       * keyValueのポインタを全て解放する
       */
      clear() {
        this._keyValues = void 0;
        this._keyValues = null;
        this._keyValues = [];
        this._size = 0;
      }
      /**
       * コンテナのサイズを取得する
       *
       * @return コンテナのサイズ
       */
      getSize() {
        return this._size;
      }
      /**
       * コンテナのキャパシティを確保する
       * @param newSize 新たなキャパシティ。引数の値が現在のサイズ未満の場合は何もしない。
       * @param fitToSize trueなら指定したサイズに合わせる。falseならサイズを2倍確保しておく。
       */
      prepareCapacity(newSize, fitToSize) {
        if (newSize > this._keyValues.length) {
          if (this._keyValues.length == 0) {
            if (!fitToSize && newSize < _csmMap.DefaultSize)
              newSize = _csmMap.DefaultSize;
            this._keyValues.length = newSize;
          } else {
            if (!fitToSize && newSize < this._keyValues.length * 2)
              newSize = this._keyValues.length * 2;
            this._keyValues.length = newSize;
          }
        }
      }
      /**
       * コンテナの先頭要素を返す
       */
      begin() {
        const ite = new iterator2(this, 0);
        return ite;
      }
      /**
       * コンテナの終端要素を返す
       */
      end() {
        const ite = new iterator2(
          this,
          this._size
        );
        return ite;
      }
      /**
       * コンテナから要素を削除する
       *
       * @param ite 削除する要素
       */
      erase(ite) {
        const index = ite._index;
        if (index < 0 || this._size <= index) {
          return ite;
        }
        this._keyValues.splice(index, 1);
        --this._size;
        const ite2 = new iterator2(
          this,
          index
        );
        return ite2;
      }
      /**
       * コンテナの値を32ビット符号付き整数型でダンプする
       */
      dumpAsInt() {
        for (let i = 0; i < this._size; i++) {
          CubismLogDebug("{0} ,", this._keyValues[i]);
          CubismLogDebug("\n");
        }
      }
      static {
        this.DefaultSize = 10;
      }
      // コンテナの要素数
    };
    var iterator2 = class _iterator {
      /**
       * コンストラクタ
       */
      constructor(v, idx) {
        this._map = v != void 0 ? v : new csmMap();
        this._index = idx != void 0 ? idx : 0;
      }
      /**
       * =演算子のオーバーロード
       */
      set(ite) {
        this._index = ite._index;
        this._map = ite._map;
        return this;
      }
      /**
       * 前置き++演算子のオーバーロード
       */
      preIncrement() {
        ++this._index;
        return this;
      }
      /**
       * 前置き--演算子のオーバーロード
       */
      preDecrement() {
        --this._index;
        return this;
      }
      /**
       * 後置き++演算子のオーバーロード
       */
      increment() {
        const iteold = new _iterator(this._map, this._index++);
        return iteold;
      }
      /**
       * 後置き--演算子のオーバーロード
       */
      decrement() {
        const iteold = new _iterator(this._map, this._index);
        this._map = iteold._map;
        this._index = iteold._index;
        return this;
      }
      /**
       * *演算子のオーバーロード
       */
      ptr() {
        return this._map._keyValues[this._index];
      }
      /**
       * !=演算
       */
      notEqual(ite) {
        return this._index != ite._index || this._map != ite._map;
      }
      // コンテナ
    };
    var Live2DCubismFramework9;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.csmMap = csmMap;
      Live2DCubismFramework12.csmPair = csmPair;
      Live2DCubismFramework12.iterator = iterator2;
    })(Live2DCubismFramework9 || (Live2DCubismFramework9 = {}));
  
    // src/utils/cubismjsonextension.ts
    var CubismJsonExtension = class _CubismJsonExtension {
      static parseJsonObject(obj, map) {
        Object.keys(obj).forEach((key) => {
          if (typeof obj[key] == "boolean") {
            const convValue = Boolean(obj[key]);
            map.put(key, new JsonBoolean(convValue));
          } else if (typeof obj[key] == "string") {
            const convValue = String(obj[key]);
            map.put(key, new JsonString(convValue));
          } else if (typeof obj[key] == "number") {
            const convValue = Number(obj[key]);
            map.put(key, new JsonFloat(convValue));
          } else if (obj[key] instanceof Array) {
            map.put(
              key,
              _CubismJsonExtension.parseJsonArray(obj[key])
            );
          } else if (obj[key] instanceof Object) {
            map.put(
              key,
              _CubismJsonExtension.parseJsonObject(obj[key], new JsonMap())
            );
          } else if (obj[key] == null) {
            map.put(key, new JsonNullvalue());
          } else {
            map.put(key, obj[key]);
          }
        });
        return map;
      }
      static parseJsonArray(obj) {
        const arr = new JsonArray();
        Object.keys(obj).forEach((key) => {
          const convKey = Number(key);
          if (typeof convKey == "number") {
            if (typeof obj[key] == "boolean") {
              const convValue = Boolean(obj[key]);
              arr.add(new JsonBoolean(convValue));
            } else if (typeof obj[key] == "string") {
              const convValue = String(obj[key]);
              arr.add(new JsonString(convValue));
            } else if (typeof obj[key] == "number") {
              const convValue = Number(obj[key]);
              arr.add(new JsonFloat(convValue));
            } else if (obj[key] instanceof Array) {
              arr.add(this.parseJsonArray(obj[key]));
            } else if (obj[key] instanceof Object) {
              arr.add(this.parseJsonObject(obj[key], new JsonMap()));
            } else if (obj[key] == null) {
              arr.add(new JsonNullvalue());
            } else {
              arr.add(obj[key]);
            }
          } else if (obj[key] instanceof Array) {
            arr.add(this.parseJsonArray(obj[key]));
          } else if (obj[key] instanceof Object) {
            arr.add(this.parseJsonObject(obj[key], new JsonMap()));
          } else if (obj[key] == null) {
            arr.add(new JsonNullvalue());
          } else {
            const convValue = Array(obj[key]);
            for (let i = 0; i < convValue.length; i++) {
              arr.add(convValue[i]);
            }
          }
        });
        return arr;
      }
    };
  
    // src/utils/cubismjson.ts
    var CSM_JSON_ERROR_TYPE_MISMATCH = "Error: type mismatch";
    var CSM_JSON_ERROR_INDEX_OF_BOUNDS = "Error: index out of bounds";
    var Value2 = class _Value {
      /**
       * コンストラクタ
       */
      constructor() {
      }
      /**
       * 要素を文字列型で返す(string)
       */
      getRawString(defaultValue, indent) {
        return this.getString(defaultValue, indent);
      }
      /**
       * 要素を数値型で返す(number)
       */
      toInt(defaultValue = 0) {
        return defaultValue;
      }
      /**
       * 要素を数値型で返す(number)
       */
      toFloat(defaultValue = 0) {
        return defaultValue;
      }
      /**
       * 要素を真偽値で返す(boolean)
       */
      toBoolean(defaultValue = false) {
        return defaultValue;
      }
      /**
       * サイズを返す
       */
      getSize() {
        return 0;
      }
      /**
       * 要素を配列で返す(Value[])
       */
      getArray(defaultValue = null) {
        return defaultValue;
      }
      /**
       * 要素をコンテナで返す(array)
       */
      getVector(defaultValue = new csmVector()) {
        return defaultValue;
      }
      /**
       * 要素をマップで返す(csmMap<csmString, Value>)
       */
      getMap(defaultValue) {
        return defaultValue;
      }
      /**
       * 添字演算子[index]
       */
      getValueByIndex(index) {
        return _Value.errorValue.setErrorNotForClientCall(
          CSM_JSON_ERROR_TYPE_MISMATCH
        );
      }
      /**
       * 添字演算子[string | csmString]
       */
      getValueByString(s) {
        return _Value.nullValue.setErrorNotForClientCall(
          CSM_JSON_ERROR_TYPE_MISMATCH
        );
      }
      /**
       * マップのキー一覧をコンテナで返す
       *
       * @return マップのキーの一覧
       */
      getKeys() {
        return _Value.dummyKeys;
      }
      /**
       * Valueの種類がエラー値ならtrue
       */
      isError() {
        return false;
      }
      /**
       * Valueの種類がnullならtrue
       */
      isNull() {
        return false;
      }
      /**
       * Valueの種類が真偽値ならtrue
       */
      isBool() {
        return false;
      }
      /**
       * Valueの種類が数値型ならtrue
       */
      isFloat() {
        return false;
      }
      /**
       * Valueの種類が文字列ならtrue
       */
      isString() {
        return false;
      }
      /**
       * Valueの種類が配列ならtrue
       */
      isArray() {
        return false;
      }
      /**
       * Valueの種類がマップ型ならtrue
       */
      isMap() {
        return false;
      }
      equals(value) {
        return false;
      }
      /**
       * Valueの値が静的ならtrue、静的なら解放しない
       */
      isStatic() {
        return false;
      }
      /**
       * Valueにエラー値をセットする
       */
      setErrorNotForClientCall(errorStr) {
        return JsonError.errorValue;
      }
      /**
       * 初期化用メソッド
       */
      static staticInitializeNotForClientCall() {
        JsonBoolean.trueValue = new JsonBoolean(true);
        JsonBoolean.falseValue = new JsonBoolean(false);
        _Value.errorValue = new JsonError("ERROR", true);
        _Value.nullValue = new JsonNullvalue();
        _Value.dummyKeys = new csmVector();
      }
      /**
       * リリース用メソッド
       */
      static staticReleaseNotForClientCall() {
        JsonBoolean.trueValue = null;
        JsonBoolean.falseValue = null;
        _Value.errorValue = null;
        _Value.nullValue = null;
        _Value.dummyKeys = null;
      }
      // 明示的に連想配列をany型で指定
    };
    var CubismJson = class _CubismJson {
      /**
       * コンストラクタ
       */
      constructor(buffer, length) {
        this._parseCallback = CubismJsonExtension.parseJsonObject;
        this._error = null;
        this._lineCount = 0;
        this._root = null;
        if (buffer != void 0) {
          this.parseBytes(buffer, length, this._parseCallback);
        }
      }
      /**
       * バイトデータから直接ロードしてパースする
       *
       * @param buffer バッファ
       * @param size バッファサイズ
       * @return CubismJsonクラスのインスタンス。失敗したらNULL
       */
      static create(buffer, size) {
        const json = new _CubismJson();
        const succeeded = json.parseBytes(
          buffer,
          size,
          json._parseCallback
        );
        if (!succeeded) {
          _CubismJson.delete(json);
          return null;
        } else {
          return json;
        }
      }
      /**
       * パースしたJSONオブジェクトの解放処理
       *
       * @param instance CubismJsonクラスのインスタンス
       */
      static delete(instance) {
        instance = null;
      }
      /**
       * パースしたJSONのルート要素を返す
       */
      getRoot() {
        return this._root;
      }
      /**
       *  UnicodeのバイナリをStringに変換
       *
       * @param buffer 変換するバイナリデータ
       * @return 変換後の文字列
       */
      static arrayBufferToString(buffer) {
        const uint8Array = new Uint8Array(buffer);
        let str = "";
        for (let i = 0, len = uint8Array.length; i < len; ++i) {
          str += "%" + this.pad(uint8Array[i].toString(16));
        }
        str = decodeURIComponent(str);
        return str;
      }
      /**
       * エンコード、パディング
       */
      static pad(n) {
        return n.length < 2 ? "0" + n : n;
      }
      /**
       * JSONのパースを実行する
       * @param buffer    パース対象のデータバイト
       * @param size      データバイトのサイズ
       * return true : 成功
       * return false: 失敗
       */
      parseBytes(buffer, size, parseCallback) {
        const endPos = new Array(1);
        const decodeBuffer = _CubismJson.arrayBufferToString(buffer);
        if (parseCallback == void 0) {
          this._root = this.parseValue(decodeBuffer, size, 0, endPos);
        } else {
          this._root = parseCallback(JSON.parse(decodeBuffer), new JsonMap());
        }
        if (this._error) {
          let strbuf = "\0";
          strbuf = "Json parse error : @line " + (this._lineCount + 1) + "\n";
          this._root = new JsonString(strbuf);
          CubismLogInfo("{0}", this._root.getRawString());
          return false;
        } else if (this._root == null) {
          this._root = new JsonError(new csmString(this._error), false);
          return false;
        }
        return true;
      }
      /**
       * パース時のエラー値を返す
       */
      getParseError() {
        return this._error;
      }
      /**
       * ルート要素の次の要素がファイルの終端だったらtrueを返す
       */
      checkEndOfFile() {
        return this._root.getArray()[1].equals("EOF");
      }
      /**
       * JSONエレメントからValue(float,String,Value*,Array,null,true,false)をパースする
       * エレメントの書式に応じて内部でParseString(), ParseObject(), ParseArray()を呼ぶ
       *
       * @param   buffer      JSONエレメントのバッファ
       * @param   length      パースする長さ
       * @param   begin       パースを開始する位置
       * @param   outEndPos   パース終了時の位置
       * @return      パースから取得したValueオブジェクト
       */
      parseValue(buffer, length, begin, outEndPos) {
        if (this._error) return null;
        let o = null;
        let i = begin;
        let f;
        for (; i < length; i++) {
          const c = buffer[i];
          switch (c) {
            case "-":
            case ".":
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9": {
              const afterString = new Array(1);
              f = strtod(buffer.slice(i), afterString);
              outEndPos[0] = buffer.indexOf(afterString[0]);
              return new JsonFloat(f);
            }
            case '"':
              return new JsonString(
                this.parseString(buffer, length, i + 1, outEndPos)
              );
            // \"の次の文字から
            case "[":
              o = this.parseArray(buffer, length, i + 1, outEndPos);
              return o;
            case "{":
              o = this.parseObject(buffer, length, i + 1, outEndPos);
              return o;
            case "n":
              if (i + 3 < length) {
                o = new JsonNullvalue();
                outEndPos[0] = i + 4;
              } else {
                this._error = "parse null";
              }
              return o;
            case "t":
              if (i + 3 < length) {
                o = JsonBoolean.trueValue;
                outEndPos[0] = i + 4;
              } else {
                this._error = "parse true";
              }
              return o;
            case "f":
              if (i + 4 < length) {
                o = JsonBoolean.falseValue;
                outEndPos[0] = i + 5;
              } else {
                this._error = "illegal ',' position";
              }
              return o;
            case ",":
              this._error = "illegal ',' position";
              return null;
            case "]":
              outEndPos[0] = i;
              return null;
            case "\n":
              this._lineCount++;
            // falls through
            case " ":
            case "	":
            case "\r":
            default:
              break;
          }
        }
        this._error = "illegal end of value";
        return null;
      }
      /**
       * 次の「"」までの文字列をパースする。
       *
       * @param   string  ->  パース対象の文字列
       * @param   length  ->  パースする長さ
       * @param   begin   ->  パースを開始する位置
       * @param  outEndPos   ->  パース終了時の位置
       * @return      パースした文F字列要素
       */
      parseString(string, length, begin, outEndPos) {
        if (this._error) {
          return null;
        }
        if (!string) {
          this._error = "string is null";
          return null;
        }
        let i = begin;
        let c, c2;
        const ret = new csmString("");
        let bufStart = begin;
        for (; i < length; i++) {
          c = string[i];
          switch (c) {
            case '"': {
              outEndPos[0] = i + 1;
              ret.append(string.slice(bufStart), i - bufStart);
              return ret.s;
            }
            // falls through
            case "//": {
              i++;
              if (i - 1 > bufStart) {
                ret.append(string.slice(bufStart), i - bufStart);
              }
              bufStart = i + 1;
              if (i < length) {
                c2 = string[i];
                switch (c2) {
                  case "\\":
                    ret.expansion(1, "\\");
                    break;
                  case '"':
                    ret.expansion(1, '"');
                    break;
                  case "/":
                    ret.expansion(1, "/");
                    break;
                  case "b":
                    ret.expansion(1, "\b");
                    break;
                  case "f":
                    ret.expansion(1, "\f");
                    break;
                  case "n":
                    ret.expansion(1, "\n");
                    break;
                  case "r":
                    ret.expansion(1, "\r");
                    break;
                  case "t":
                    ret.expansion(1, "	");
                    break;
                  case "u":
                    this._error = "parse string/unicord escape not supported";
                    break;
                  default:
                    break;
                }
              } else {
                this._error = "parse string/escape error";
              }
            }
            // falls through
            default: {
              break;
            }
          }
        }
        this._error = "parse string/illegal end";
        return null;
      }
      /**
       * JSONのオブジェクトエレメントをパースしてValueオブジェクトを返す
       *
       * @param buffer    JSONエレメントのバッファ
       * @param length    パースする長さ
       * @param begin     パースを開始する位置
       * @param outEndPos パース終了時の位置
       * @return パースから取得したValueオブジェクト
       */
      parseObject(buffer, length, begin, outEndPos) {
        if (this._error) {
          return null;
        }
        if (!buffer) {
          this._error = "buffer is null";
          return null;
        }
        const ret = new JsonMap();
        let key = "";
        let i = begin;
        let c = "";
        const localRetEndPos2 = Array(1);
        let ok = false;
        for (; i < length; i++) {
          FOR_LOOP: for (; i < length; i++) {
            c = buffer[i];
            switch (c) {
              case '"':
                key = this.parseString(buffer, length, i + 1, localRetEndPos2);
                if (this._error) {
                  return null;
                }
                i = localRetEndPos2[0];
                ok = true;
                break FOR_LOOP;
              //-- loopから出る
              case "}":
                outEndPos[0] = i + 1;
                return ret;
              // 空
              case ":":
                this._error = "illegal ':' position";
                break;
              case "\n":
                this._lineCount++;
              // falls through
              default:
                break;
            }
          }
          if (!ok) {
            this._error = "key not found";
            return null;
          }
          ok = false;
          FOR_LOOP2: for (; i < length; i++) {
            c = buffer[i];
            switch (c) {
              case ":":
                ok = true;
                i++;
                break FOR_LOOP2;
              case "}":
                this._error = "illegal '}' position";
                break;
              // falls through
              case "\n":
                this._lineCount++;
              // case ' ': case '\t' : case '\r':
              // falls through
              default:
                break;
            }
          }
          if (!ok) {
            this._error = "':' not found";
            return null;
          }
          const value = this.parseValue(buffer, length, i, localRetEndPos2);
          if (this._error) {
            return null;
          }
          i = localRetEndPos2[0];
          ret.put(key, value);
          FOR_LOOP3: for (; i < length; i++) {
            c = buffer[i];
            switch (c) {
              case ",":
                break FOR_LOOP3;
              case "}":
                outEndPos[0] = i + 1;
                return ret;
              // 正常終了
              case "\n":
                this._lineCount++;
              // falls through
              default:
                break;
            }
          }
        }
        this._error = "illegal end of perseObject";
        return null;
      }
      /**
       * 次の「"」までの文字列をパースする。
       * @param buffer    JSONエレメントのバッファ
       * @param length    パースする長さ
       * @param begin     パースを開始する位置
       * @param outEndPos パース終了時の位置
       * @return パースから取得したValueオブジェクト
       */
      parseArray(buffer, length, begin, outEndPos) {
        if (this._error) {
          return null;
        }
        if (!buffer) {
          this._error = "buffer is null";
          return null;
        }
        let ret = new JsonArray();
        let i = begin;
        let c;
        const localRetEndpos2 = new Array(1);
        for (; i < length; i++) {
          const value = this.parseValue(buffer, length, i, localRetEndpos2);
          if (this._error) {
            return null;
          }
          i = localRetEndpos2[0];
          if (value) {
            ret.add(value);
          }
          FOR_LOOP: for (; i < length; i++) {
            c = buffer[i];
            switch (c) {
              case ",":
                break FOR_LOOP;
              case "]":
                outEndPos[0] = i + 1;
                return ret;
              // 終了
              case "\n":
                ++this._lineCount;
              //case ' ': case '\t': case '\r':
              // falls through
              default:
                break;
            }
          }
        }
        ret = void 0;
        this._error = "illegal end of parseObject";
        return null;
      }
      // パースされたルート要素
    };
    var JsonFloat = class extends Value2 {
      /**
       * コンストラクタ
       */
      constructor(v) {
        super();
        this._value = v;
      }
      /**
       * Valueの種類が数値型ならtrue
       */
      isFloat() {
        return true;
      }
      /**
       * 要素を文字列で返す(csmString型)
       */
      getString(defaultValue, indent) {
        const strbuf = "\0";
        this._value = parseFloat(strbuf);
        this._stringBuffer = strbuf;
        return this._stringBuffer;
      }
      /**
       * 要素を数値型で返す(number)
       */
      toInt(defaultValue = 0) {
        return parseInt(this._value.toString());
      }
      /**
       * 要素を数値型で返す(number)
       */
      toFloat(defaultValue = 0) {
        return this._value;
      }
      equals(value) {
        if ("number" === typeof value) {
          if (Math.round(value)) {
            return false;
          } else {
            return value == this._value;
          }
        }
        return false;
      }
      // JSON要素の値
    };
    var JsonBoolean = class extends Value2 {
      /**
       * Valueの種類が真偽値ならtrue
       */
      isBool() {
        return true;
      }
      /**
       * 要素を真偽値で返す(boolean)
       */
      toBoolean(defaultValue = false) {
        return this._boolValue;
      }
      /**
       * 要素を文字列で返す(csmString型)
       */
      getString(defaultValue, indent) {
        this._stringBuffer = this._boolValue ? "true" : "false";
        return this._stringBuffer;
      }
      equals(value) {
        if ("boolean" === typeof value) {
          return value == this._boolValue;
        }
        return false;
      }
      /**
       * Valueの値が静的ならtrue, 静的なら解放しない
       */
      isStatic() {
        return true;
      }
      /**
       * 引数付きコンストラクタ
       */
      constructor(v) {
        super();
        this._boolValue = v;
      }
      // JSON要素の値
    };
    var JsonString = class extends Value2 {
      constructor(s) {
        super();
        if ("string" === typeof s) {
          this._stringBuffer = s;
        }
        if (s instanceof csmString) {
          this._stringBuffer = s.s;
        }
      }
      /**
       * Valueの種類が文字列ならtrue
       */
      isString() {
        return true;
      }
      /**
       * 要素を文字列で返す(csmString型)
       */
      getString(defaultValue, indent) {
        return this._stringBuffer;
      }
      equals(value) {
        if ("string" === typeof value) {
          return this._stringBuffer == value;
        }
        if (value instanceof csmString) {
          return this._stringBuffer == value.s;
        }
        return false;
      }
    };
    var JsonError = class extends JsonString {
      /**
       * Valueの値が静的ならtrue、静的なら解放しない
       */
      isStatic() {
        return this._isStatic;
      }
      /**
       * エラー情報をセットする
       */
      setErrorNotForClientCall(s) {
        this._stringBuffer = s;
        return this;
      }
      /**
       * 引数付きコンストラクタ
       */
      constructor(s, isStatic) {
        if ("string" === typeof s) {
          super(s);
        } else {
          super(s);
        }
        this._isStatic = isStatic;
      }
      /**
       * Valueの種類がエラー値ならtrue
       */
      isError() {
        return true;
      }
      // 静的なValueかどうか
    };
    var JsonNullvalue = class extends Value2 {
      /**
       * Valueの種類がNULL値ならtrue
       */
      isNull() {
        return true;
      }
      /**
       * 要素を文字列で返す(csmString型)
       */
      getString(defaultValue, indent) {
        return this._stringBuffer;
      }
      /**
       * Valueの値が静的ならtrue, 静的なら解放しない
       */
      isStatic() {
        return true;
      }
      /**
       * Valueにエラー値をセットする
       */
      setErrorNotForClientCall(s) {
        this._stringBuffer = s;
        return JsonError.nullValue;
      }
      /**
       * コンストラクタ
       */
      constructor() {
        super();
        this._stringBuffer = "NullValue";
      }
    };
    var JsonArray = class extends Value2 {
      /**
       * コンストラクタ
       */
      constructor() {
        super();
        this._array = new csmVector();
      }
      /**
       * デストラクタ相当の処理
       */
      release() {
        for (let ite = this._array.begin(); ite.notEqual(this._array.end()); ite.preIncrement()) {
          let v = ite.ptr();
          if (v && !v.isStatic()) {
            v = void 0;
            v = null;
          }
        }
      }
      /**
       * Valueの種類が配列ならtrue
       */
      isArray() {
        return true;
      }
      /**
       * 添字演算子[index]
       */
      getValueByIndex(index) {
        if (index < 0 || this._array.getSize() <= index) {
          return Value2.errorValue.setErrorNotForClientCall(
            CSM_JSON_ERROR_INDEX_OF_BOUNDS
          );
        }
        const v = this._array.at(index);
        if (v == null) {
          return Value2.nullValue;
        }
        return v;
      }
      /**
       * 添字演算子[string | csmString]
       */
      getValueByString(s) {
        return Value2.errorValue.setErrorNotForClientCall(
          CSM_JSON_ERROR_TYPE_MISMATCH
        );
      }
      /**
       * 要素を文字列で返す(csmString型)
       */
      getString(defaultValue, indent) {
        const stringBuffer = indent + "[\n";
        for (let ite = this._array.begin(); ite.notEqual(this._array.end()); ite.increment()) {
          const v = ite.ptr();
          this._stringBuffer += indent + "" + v.getString(indent + " ") + "\n";
        }
        this._stringBuffer = stringBuffer + indent + "]\n";
        return this._stringBuffer;
      }
      /**
       * 配列要素を追加する
       * @param v 追加する要素
       */
      add(v) {
        this._array.pushBack(v);
      }
      /**
       * 要素をコンテナで返す(csmVector<Value>)
       */
      getVector(defaultValue = null) {
        return this._array;
      }
      /**
       * 要素の数を返す
       */
      getSize() {
        return this._array.getSize();
      }
      // JSON要素の値
    };
    var JsonMap = class extends Value2 {
      /**
       * コンストラクタ
       */
      constructor() {
        super();
        this._map = new csmMap();
      }
      /**
       * デストラクタ相当の処理
       */
      release() {
        const ite = this._map.begin();
        while (ite.notEqual(this._map.end())) {
          let v = ite.ptr().second;
          if (v && !v.isStatic()) {
            v = void 0;
            v = null;
          }
          ite.preIncrement();
        }
      }
      /**
       * Valueの値がMap型ならtrue
       */
      isMap() {
        return true;
      }
      /**
       * 添字演算子[string | csmString]
       */
      getValueByString(s) {
        if (s instanceof csmString) {
          const ret = this._map.getValue(s.s);
          if (ret == null) {
            return Value2.nullValue;
          }
          return ret;
        }
        for (let iter = this._map.begin(); iter.notEqual(this._map.end()); iter.preIncrement()) {
          if (iter.ptr().first == s) {
            if (iter.ptr().second == null) {
              return Value2.nullValue;
            }
            return iter.ptr().second;
          }
        }
        return Value2.nullValue;
      }
      /**
       * 添字演算子[index]
       */
      getValueByIndex(index) {
        return Value2.errorValue.setErrorNotForClientCall(
          CSM_JSON_ERROR_TYPE_MISMATCH
        );
      }
      /**
       * 要素を文字列で返す(csmString型)
       */
      getString(defaultValue, indent) {
        this._stringBuffer = indent + "{\n";
        const ite = this._map.begin();
        while (ite.notEqual(this._map.end())) {
          const key = ite.ptr().first;
          const v = ite.ptr().second;
          this._stringBuffer += indent + " " + key + " : " + v.getString(indent + "   ") + " \n";
          ite.preIncrement();
        }
        this._stringBuffer += indent + "}\n";
        return this._stringBuffer;
      }
      /**
       * 要素をMap型で返す
       */
      getMap(defaultValue) {
        return this._map;
      }
      /**
       * Mapに要素を追加する
       */
      put(key, v) {
        this._map.setValue(key, v);
      }
      /**
       * Mapからキーのリストを取得する
       */
      getKeys() {
        if (!this._keys) {
          this._keys = new csmVector();
          const ite = this._map.begin();
          while (ite.notEqual(this._map.end())) {
            const key = ite.ptr().first;
            this._keys.pushBack(key);
            ite.preIncrement();
          }
        }
        return this._keys;
      }
      /**
       * Mapの要素数を取得する
       */
      getSize() {
        return this._keys.getSize();
      }
      // JSON要素の値
    };
    var Live2DCubismFramework10;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.CubismJson = CubismJson;
      Live2DCubismFramework12.JsonArray = JsonArray;
      Live2DCubismFramework12.JsonBoolean = JsonBoolean;
      Live2DCubismFramework12.JsonError = JsonError;
      Live2DCubismFramework12.JsonFloat = JsonFloat;
      Live2DCubismFramework12.JsonMap = JsonMap;
      Live2DCubismFramework12.JsonNullvalue = JsonNullvalue;
      Live2DCubismFramework12.JsonString = JsonString;
      Live2DCubismFramework12.Value = Value2;
    })(Live2DCubismFramework10 || (Live2DCubismFramework10 = {}));
  
    // src/live2dcubismframework.ts
    function strtod(s, endPtr) {
      let index = 0;
      for (let i = 1; ; i++) {
        const testC = s.slice(i - 1, i);
        if (testC == "e" || testC == "-" || testC == "E") {
          continue;
        }
        const test = s.substring(0, i);
        const number = Number(test);
        if (isNaN(number)) {
          break;
        }
        index = i;
      }
      let d = parseFloat(s);
      if (isNaN(d)) {
        d = NaN;
      }
      endPtr[0] = s.slice(index);
      return d;
    }
    var s_isStarted = false;
    var s_isInitialized = false;
    var s_option = null;
    var s_cubismIdManager = null;
    var Constant = Object.freeze({
      vertexOffset: 0,
      // メッシュ頂点のオフセット値
      vertexStep: 2
      // メッシュ頂点のステップ値
    });
    function csmDelete(address) {
      if (!address) {
        return;
      }
      address = void 0;
    }
    var CubismFramework = class {
      /**
       * Cubism FrameworkのAPIを使用可能にする。
       *  APIを実行する前に必ずこの関数を実行すること。
       *  一度準備が完了して以降は、再び実行しても内部処理がスキップされます。
       *
       * @param    option      Optionクラスのインスタンス
       *
       * @return   準備処理が完了したらtrueが返ります。
       */
      static startUp(option = null) {
        if (s_isStarted) {
          CubismLogInfo("CubismFramework.startUp() is already done.");
          return s_isStarted;
        }
        s_option = option;
        if (s_option != null) {
          Live2DCubismCore.Logging.csmSetLogFunction(s_option.logFunction);
        }
        s_isStarted = true;
        if (s_isStarted) {
          const version = Live2DCubismCore.Version.csmGetVersion();
          const major = (version & 4278190080) >> 24;
          const minor = (version & 16711680) >> 16;
          const patch = version & 65535;
          const versionNumber = version;
          CubismLogInfo(
            `Live2D Cubism Core version: {0}.{1}.{2} ({3})`,
            ("00" + major).slice(-2),
            ("00" + minor).slice(-2),
            ("0000" + patch).slice(-4),
            versionNumber
          );
        }
        CubismLogInfo("CubismFramework.startUp() is complete.");
        return s_isStarted;
      }
      /**
       * StartUp()で初期化したCubismFrameworkの各パラメータをクリアします。
       * Dispose()したCubismFrameworkを再利用する際に利用してください。
       */
      static cleanUp() {
        s_isStarted = false;
        s_isInitialized = false;
        s_option = null;
        s_cubismIdManager = null;
      }
      /**
       * Cubism Framework内のリソースを初期化してモデルを表示可能な状態にします。<br>
       *     再度Initialize()するには先にDispose()を実行する必要があります。
       *
       * @param memorySize 初期化時メモリ量 [byte(s)]
       *    複数モデル表示時などにモデルが更新されない際に使用してください。
       *    指定する際は必ず1024*1024*16 byte(16MB)以上の値を指定してください。
       *    それ以外はすべて1024*1024*16 byteに丸めます。
       */
      static initialize(memorySize = 0) {
        CSM_ASSERT(s_isStarted);
        if (!s_isStarted) {
          CubismLogWarning("CubismFramework is not started.");
          return;
        }
        if (s_isInitialized) {
          CubismLogWarning(
            "CubismFramework.initialize() skipped, already initialized."
          );
          return;
        }
        Value2.staticInitializeNotForClientCall();
        s_cubismIdManager = new CubismIdManager();
        Live2DCubismCore.Memory.initializeAmountOfMemory(memorySize);
        s_isInitialized = true;
        CubismLogInfo("CubismFramework.initialize() is complete.");
      }
      /**
       * Cubism Framework内の全てのリソースを解放します。
       *      ただし、外部で確保されたリソースについては解放しません。
       *      外部で適切に破棄する必要があります。
       */
      static dispose() {
        CSM_ASSERT(s_isStarted);
        if (!s_isStarted) {
          CubismLogWarning("CubismFramework is not started.");
          return;
        }
        if (!s_isInitialized) {
          CubismLogWarning("CubismFramework.dispose() skipped, not initialized.");
          return;
        }
        Value2.staticReleaseNotForClientCall();
        s_cubismIdManager.release();
        s_cubismIdManager = null;
        CubismRenderer.staticRelease();
        s_isInitialized = false;
        CubismLogInfo("CubismFramework.dispose() is complete.");
      }
      /**
       * Cubism FrameworkのAPIを使用する準備が完了したかどうか
       * @return APIを使用する準備が完了していればtrueが返ります。
       */
      static isStarted() {
        return s_isStarted;
      }
      /**
       * Cubism Frameworkのリソース初期化がすでに行われているかどうか
       * @return リソース確保が完了していればtrueが返ります
       */
      static isInitialized() {
        return s_isInitialized;
      }
      /**
       * Core APIにバインドしたログ関数を実行する
       *
       * @praram message ログメッセージ
       */
      static coreLogFunction(message) {
        if (!Live2DCubismCore.Logging.csmGetLogFunction()) {
          return;
        }
        Live2DCubismCore.Logging.csmGetLogFunction()(message);
      }
      /**
       * 現在のログ出力レベル設定の値を返す。
       *
       * @return  現在のログ出力レベル設定の値
       */
      static getLoggingLevel() {
        if (s_option != null) {
          return s_option.loggingLevel;
        }
        return 5 /* LogLevel_Off */;
      }
      /**
       * IDマネージャのインスタンスを取得する
       * @return CubismManagerクラスのインスタンス
       */
      static getIdManager() {
        return s_cubismIdManager;
      }
      /**
       * 静的クラスとして使用する
       * インスタンス化させない
       */
      constructor() {
      }
    };
    var Option = class {
      // ログ出力レベルの設定
    };
    var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
      LogLevel2[LogLevel2["LogLevel_Verbose"] = 0] = "LogLevel_Verbose";
      LogLevel2[LogLevel2["LogLevel_Debug"] = 1] = "LogLevel_Debug";
      LogLevel2[LogLevel2["LogLevel_Info"] = 2] = "LogLevel_Info";
      LogLevel2[LogLevel2["LogLevel_Warning"] = 3] = "LogLevel_Warning";
      LogLevel2[LogLevel2["LogLevel_Error"] = 4] = "LogLevel_Error";
      LogLevel2[LogLevel2["LogLevel_Off"] = 5] = "LogLevel_Off";
      return LogLevel2;
    })(LogLevel || {});
    var Live2DCubismFramework11;
    ((Live2DCubismFramework12) => {
      Live2DCubismFramework12.Constant = Constant;
      Live2DCubismFramework12.csmDelete = csmDelete;
      Live2DCubismFramework12.CubismFramework = CubismFramework;
    })(Live2DCubismFramework11 || (Live2DCubismFramework11 = {}));
    return __toCommonJS(live2dcubismframework_exports);
  })();
  