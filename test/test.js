const om = require("../index");

describe("Object Mapper Async", () => {
  it("SPLIT with complicated key", async () => {
    const k = "abc.def.ghi.j..k\\.l\\\\.m.";
    const expected = ["abc", "def", "ghi", "j", "", "k.l\\\\", "m", ""];
    const result = await om.split(k, ".");
    expect(result).toEqual(expected);
  });

  it("PARSE with complicated key", async () => {
    const k = "abc[].def[42]+.ghi?.j..k\\.l\\\\.m.";
    const expected = [
      { name: "abc" },
      { ix: "" },
      { name: "def" },
      { ix: "42", add: true },
      { name: "ghi", nulls: true },
      { name: "j" },
      { name: "k.l\\\\" },
      { name: "m" },
    ];
    const result = await om.parse(k, ".");
    expect(result).toEqual(expected);
  });

  it("PARSE with simple key", async () => {
    const k = "abc";
    const expected = [{ name: "abc" }];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE abc? (simple key allowing nulls)", async () => {
    const k = "abc?";
    const expected = [{ name: "abc", nulls: true }];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with simple empty array key", async () => {
    const k = "abc[]";
    const expected = [{ name: "abc" }, { ix: "" }];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with no key empty array key", async () => {
    const k = "[]";
    const expected = [{ ix: "" }];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with nothing", async () => {
    const k = "";
    const expected = [];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with simple dot notation key", async () => {
    const k = "abc.def";
    const expected = [{ name: "abc" }, { name: "def" }];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with deep dot notation key", async () => {
    const k = "a.b.c.d.e.f";
    const expected = [
      { name: "a" },
      { name: "b" },
      { name: "c" },
      { name: "d" },
      { name: "e" },
      { name: "f" },
    ];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with deep brackets", async () => {
    const k = "abc[].def";
    const expected = [{ name: "abc" }, { ix: "" }, { name: "def" }];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with deep brackets and instruction to add together", async () => {
    const k = "abc[]+.def";
    const expected = [{ name: "abc" }, { ix: "", add: true }, { name: "def" }];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with deep brackets and instruction to add nulls", async () => {
    const k = "abc[]+.def?";
    const expected = [
      { name: "abc" },
      { ix: "", add: true },
      { name: "def", nulls: true },
    ];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("PARSE with deep brackets", async () => {
    const k = "[].def";
    const expected = [{ ix: "" }, { name: "def" }];
    const result = await om.parse(k);
    expect(result).toEqual(expected);
  });

  it("MAP with empty default on missing key", async () => {
    const obj = { foo: "bar" };
    const map = { undefined_key: { key: "key_with_default", default: "" } };
    const expected = { key_with_default: "" };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("MAP with null default on missing key", async () => {
    const obj = { foo: "bar" };
    const map = { undefined_key: { key: "key_with_default", default: null } };
    const expected = { key_with_default: null };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("MAP - multiple levels of array indexes on both the from and to arrays", async () => {
    const obj = {
      Items: [
        { SubItems: [{ SubKey: "item 1 id a" }, { SubKey: "item 1 id b" }] },
        { SubItems: [{ SubKey: "item 2 id a" }, { SubKey: "item 2 id b" }] },
      ],
    };
    const expected = {
      items: [
        { subitems: [{ subkey: "item 1 id a" }, { subkey: "item 1 id b" }] },
        { subitems: [{ subkey: "item 2 id a" }, { subkey: "item 2 id b" }] },
      ],
    };
    const map = {
      "Items[].SubItems[].SubKey": "items[].subitems[].subkey",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("get value - one level deep", async () => {
    const obj = { foo: { bar: "baz" } };
    const map = "foo.bar";
    const expected = "baz";
    const result = await om.getKeyValue(obj, map);
    expect(result).toEqual(expected);
  });

  it("get value - starting with simple array", async () => {
    const obj = ["bar"];
    const map = "[]";
    const expected = ["bar"];
    const result = await om.getKeyValue(obj, map);
    expect(result).toEqual(expected);
  });

  it("get value - simple array defined index", async () => {
    const obj = ["foo", "bar"];
    const map = "[1]";
    const expected = "bar";
    const result = await om.getKeyValue(obj, map);
    expect(result).toEqual(expected);
  });

  it("get value - simple array negative index", async () => {
    const obj = ["foo", "bar"];
    const map = "[-1]";
    const expected = "bar";
    const result = await om.getKeyValue(obj, map);
    expect(result).toEqual(expected);
  });

  it("get value - simple array dot property", async () => {
    const obj = [{ name: "foo" }, { name: "bar" }];
    const map = "[-1].name";
    const expected = "bar";
    const result = await om.getKeyValue(obj, map);
    expect(result).toEqual(expected);
  });

  it("get value - simple array negative index falls off array", async () => {
    const obj = ["foo", "bar"];
    const map = "[-3]";
    const expected = null;
    const result = await om.getKeyValue(obj, map);
    expect(result).toEqual(expected);
  });

  it("get value - two levels deep", async () => {
    const key = "foo.baz.fog";
    const obj = {
      foo: {
        baz: {
          fog: "bar",
        },
      },
    };
    const expected = "bar";
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - one level deep and item is a array", async () => {
    const key = "foo.baz[]";
    const obj = {
      foo: {
        baz: ["bar"],
      },
    };
    const expected = ["bar"];
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - one level deep and first item of array", async () => {
    const key = "foo.baz[1]";
    const obj = {
      foo: {
        baz: ["bar", "foo"],
      },
    };
    const expected = "foo";
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - one level deep and array and one level", async () => {
    const key = "foo.baz[].fog";
    const obj = {
      foo: {
        baz: [
          {
            fog: "bar",
          },
        ],
      },
    };
    const expected = ["bar"];
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - one level deep and first item of array and one level", async () => {
    const key = "foo.baz[0].fog";
    const obj = {
      foo: {
        baz: [
          {
            fog: "bar",
          },
        ],
      },
    };
    const expected = "bar";
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - one level deep and first item of array and two levels", async () => {
    const key = "foo.baz[0].fog.baz";
    const obj = {
      foo: {
        baz: [
          {
            fog: {
              baz: "bar",
            },
          },
        ],
      },
    };
    const expected = "bar";
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - one level array", async () => {
    const key = "foo[]";
    const obj = {
      foo: [
        {
          baz: [
            {
              fog: {
                baz: "bar",
              },
            },
          ],
        },
      ],
    };
    const expected = [
      {
        baz: [
          {
            fog: {
              baz: "bar",
            },
          },
        ],
      },
    ];
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - two level deep array", async () => {
    const key = "foo[].baz[].fog.baz";
    const obj = {
      foo: [{ baz: [{ fog: { baz: "bar" } }, { fog: { baz: "var" } }] }],
    };
    const expected = [["bar", "var"]];
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - crazy", async () => {
    const key = "foo.baz[0].fog[1].baz";
    const obj = {
      foo: {
        baz: [
          {
            fog: [
              ,
              {
                baz: "bar",
              },
            ],
          },
        ],
      },
    };
    const expected = "bar";
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("get value - crazy negative", async () => {
    const key = "foo.baz[-1].fog[1].baz";
    const obj = {
      foo: {
        baz: [
          {
            fog: [
              ,
              {
                baz: "bar",
              },
            ],
          },
        ],
      },
    };
    const expected = "bar";
    const result = await om.getKeyValue(obj, key);
    expect(result).toEqual(expected);
  });

  it("select with array object where map is not an array 1", async () => {
    const obj = { foo: [{ bar: "a" }, { bar: "b" }, { bar: "c" }] };
    const map = "foo.bar";
    const expected = "a";
    const result = await om.getKeyValue(obj, map);
    expect(result).toEqual(expected);
  });

  it("select with array object where map is not an array 2", async () => {
    const obj = { foo: [{ bar: "a" }, { bar: "b" }, { bar: "c" }] };
    const map = "foo[].bar";
    const expected = ["a", "b", "c"];
    const result = await om.getKeyValue(obj, map);
    expect(result).toEqual(expected);
  });

  it("set value - simple", async () => {
    const key = "foo";
    const value = "bar";
    const expected = {
      foo: "bar",
    };
    const result = await om.setKeyValue(null, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - simple with base object", async () => {
    const key = "foo";
    const value = "bar";
    const base = {
      baz: "foo",
    };
    const expected = {
      baz: "foo",
      foo: "bar",
    };
    const result = await om.setKeyValue(base, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - simple array", async () => {
    const key = "[]";
    const value = "bar";
    const expected = ["bar"];
    const result = await om.setKeyValue(null, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - simple array with base array", async () => {
    const key = "[]";
    const value = "bar";
    const base = ["foo"];
    const expected = ["bar"];
    const result = await om.setKeyValue(base, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - simple array in index 0", async () => {
    const map = "[0]";
    const data = "bar";
    const expected = ["bar"];
    const result = await om.setKeyValue(null, map, data);
    expect(result).toEqual(expected);
  });

  it("set value - simple array in index 0 with base array", async () => {
    const key = "[0]";
    const value = "bar";
    const base = ["foo"];
    const expected = ["bar"];
    const result = await om.setKeyValue(base, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - simple array in index 1", async () => {
    const map = "[1]";
    const data = "bar";
    const expected = [, "bar"];
    const result = await om.setKeyValue(null, map, data);
    expect(result).toEqual(expected);
  });

  it("set value - one level deep", async () => {
    const key = "foo.bar";
    const value = "baz";
    const expected = {
      foo: {
        bar: "baz",
      },
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - object inside simple array", async () => {
    const key = "[].foo";
    const value = "bar";
    const expected = [
      {
        foo: "bar",
      },
    ];
    const result = await om.setKeyValue(null, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - array to object inside simple array", async () => {
    const key = "[].foo";
    const value = ["bar", "baz"];
    const expected = [
      {
        foo: "bar",
      },
      {
        foo: "baz",
      },
    ];
    const result = await om.setKeyValue(null, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - object inside simple array defined index", async () => {
    const key = "[3].foo";
    const data = "bar";
    const expected = [
      ,
      ,
      ,
      {
        foo: "bar",
      },
    ];
    const result = await om.setKeyValue(null, key, data);
    expect(result).toEqual(expected);
  });

  it("set value - two levels deep", async () => {
    const key = "foo.bar.baz";
    const value = "foo";
    const expected = {
      foo: {
        bar: {
          baz: "foo",
        },
      },
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - one level deep inside array", async () => {
    const key = "foo.bar[]";
    const value = "baz";
    const expected = {
      foo: {
        bar: ["baz"],
      },
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - one level deep inside array with one level deep", async () => {
    const key = "foo.bar[].baz";
    const value = "foo";
    const expected = {
      foo: {
        bar: [
          {
            baz: "foo",
          },
        ],
      },
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - one level deep inside array with one level deep inside a existing array", async () => {
    const key = "foo.bar[].baz";
    const value = "foo";
    const base = {
      foo: {
        bar: [
          {
            bar: "baz",
          },
        ],
      },
    };
    const expected = {
      foo: {
        bar: [
          {
            bar: "baz",
            baz: "foo",
          },
        ],
      },
    };
    const result = await om.setKeyValue(base, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - one level deep inside array at defined index with one level deep", async () => {
    const key = "foo.bar[1].baz";
    const value = "foo";
    const expected = {
      foo: {
        bar: [
          ,
          {
            baz: "foo",
          },
        ],
      },
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - array to simple object", async () => {
    const key = "foo[].baz";
    const value = ["foo", "var"];
    const expected = {
      foo: [
        {
          baz: "foo",
        },
        {
          baz: "var",
        },
      ],
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - array to two level object", async () => {
    const key = "bar.foo[].baz";
    const value = ["foo", "var"];
    const expected = {
      bar: {
        foo: [
          {
            baz: "foo",
          },
          {
            baz: "var",
          },
        ],
      },
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - array to two level object 2", async () => {
    const key = "bar.foo[].baz.foo";
    const value = ["foo", "var"];
    const expected = {
      bar: {
        foo: [
          {
            baz: {
              foo: "foo",
            },
          },
          {
            baz: {
              foo: "var",
            },
          },
        ],
      },
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - array to object", async () => {
    const key = "foo[].bar[].baz";
    const value = [["foo", "var"]];
    const expected = {
      foo: [
        {
          bar: [
            {
              baz: "foo",
            },
            {
              baz: "var",
            },
          ],
        },
      ],
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("set value - crazy", async () => {
    const key = "foo.bar[1].baz[2].thing";
    const value = "foo";
    const expected = {
      foo: {
        bar: [
          ,
          {
            baz: [
              ,
              ,
              {
                thing: "foo",
              },
            ],
          },
        ],
      },
    };
    const result = await om.setKeyValue({}, key, value);
    expect(result).toEqual(expected);
  });

  it("map object to another - simple", async () => {
    const obj = {
      foo: "bar",
    };
    const expected = {
      bar: "bar",
    };
    const map = {
      foo: "bar",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - complexity 1", async () => {
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      bar: {
        foo: "baz",
      },
    };
    const map = {
      "foo.bar": "bar.foo",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - complexity 2", async () => {
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      bar: {
        foo: [
          {
            baz: "baz",
          },
        ],
      },
    };
    const map = {
      "foo.bar": "bar.foo[].baz",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with base object", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz",
          },
        ],
      },
    };
    const map = {
      "foo.bar": "bar.foo[].baz",
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with two destinations for same value", async () => {
    const to_obj = {
      test: 1,
    };
    const from_obj = {
      foo: "bar",
    };
    const expected = {
      test: 1,
      bar: "bar",
      baz: "bar",
    };
    const map = {
      foo: ["bar", "baz"],
    };
    const result = await om(from_obj, to_obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with two destinations for same value inside object", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: {
          baz: "baz",
          foo: "baz",
        },
      },
    };
    const map = {
      "foo.bar": ["bar.foo.baz", "bar.foo.foo"],
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with two destinations for same value inside array", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz",
            foo: "baz",
          },
        ],
      },
    };
    const map = {
      "foo.bar": ["bar.foo[].baz", "bar.foo[].foo"],
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with three destinations for same value", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz",
            foo: "baz",
            bar: ["baz"],
          },
        ],
      },
    };
    const map = {
      "foo.bar": ["bar.foo[].baz", "bar.foo[].foo", "bar.foo[].bar[]"],
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key object notation", async () => {
    const to_obj = {
      test: 1,
    };
    const from_obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz",
          },
        ],
      },
    };
    const map = {
      "foo.bar": {
        key: "bar.foo[].baz",
      },
    };
    const result = await om(from_obj, to_obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key object notation with default value when key does not exists", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: 10,
          },
        ],
      },
    };
    const map = {
      notExistingKey: {
        key: "bar.foo[].baz",
        default: 10,
      },
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key object notation with default function when key does not exists", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz",
          },
        ],
      },
    };
    const map = {
      notExistingKey: {
        key: "bar.foo[].baz",
        default: function (fromObject, fromKey, toObject, toKey) {
          return fromObject.foo.bar;
        },
      },
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - when target key is undefined it should be ignored", async () => {
    const obj = {
      a: 1234,
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      bar: {
        bar: "baz",
      },
    };
    const map = {
      "foo.bar": "bar.bar",
      a: undefined,
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key object notation with default function returning undefined when key does not exists", async () => {
    const obj = {
      a: 1234,
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      bar: {
        bar: "baz",
        a: 1234,
      },
    };
    const map = {
      "foo.bar": "bar.bar",
      notExistingKey: {
        key: "bar.test",
        default: function (fromObject, fromKey, toObject, toKey) {
          return undefined;
        },
      },
      a: "bar.a",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key object notation with transform", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz-foo",
          },
        ],
      },
    };
    const map = {
      "foo.bar": {
        key: "bar.foo[].baz",
        transform: function (value, fromObject, toObject, fromKey, toKey) {
          return value + "-foo";
        },
      },
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with two destinations for same value one string and one object", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz",
            foo: "baz-foo",
          },
        ],
      },
    };
    const map = {
      "foo.bar": [
        "bar.foo[].baz",
        {
          key: "bar.foo[].foo",
          transform: function (value, fromObject, toObject, fromKey, toKey) {
            return value + "-foo";
          },
        },
      ],
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key array notation", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz",
          },
        ],
      },
    };
    const map = {
      "foo.bar": [["bar.foo[].baz"]],
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key array notation with default value when key does not exists", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: 10,
          },
        ],
      },
    };
    const map = {
      notExistingKey: [["bar.foo[].baz", null, 10]],
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key array notation with default function when key does not exists", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz",
          },
        ],
      },
    };
    const map = {
      notExistingKey: [
        [
          "bar.foo[].baz",
          null,
          function (fromObject, fromKey, toObject, toKey) {
            return fromObject.foo.bar;
          },
        ],
      ],
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - with key array notation with transform function", async () => {
    const baseObject = {
      test: 1,
    };
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      test: 1,
      bar: {
        foo: [
          {
            baz: "baz-foo",
          },
        ],
      },
    };
    const map = {
      "foo.bar": [
        [
          "bar.foo[].baz",
          function (value, fromObject, toObject, fromKey, toKey) {
            return value + "-foo";
          },
        ],
      ],
    };
    const result = await om(obj, baseObject, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - map object without destination key via transform", async () => {
    const obj = {
      thing: {
        thing2: {
          thing3: {
            a: "a1",
            b: "b1",
          },
        },
      },
    };
    const map = {
      "thing.thing2.thing3": [
        [
          null,
          function (val, src, dst) {
            dst.manual = val.a + val.b;
          },
          null,
        ],
      ],
    };
    const expected = {
      manual: "a1b1",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("array mapping - simple", async () => {
    const obj = {
      comments: [
        { a: "a1", b: "b1" },
        { a: "a2", b: "b2" },
      ],
    };
    const map = {
      "comments[].a": ["comments[].c"],
      "comments[].b": ["comments[].d"],
    };
    const expected = {
      comments: [
        { c: "a1", d: "b1" },
        { c: "a2", d: "b2" },
      ],
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("array mapping - two level deep", async () => {
    const obj = {
      comments: [
        {
          data: [
            { a: "a1", b: "b1" },
            { a: "a2", b: "b2" },
          ],
        },
      ],
    };
    const map = {
      "comments[].data[].a": "comments[].data[].c",
      "comments[].data[].b": "comments[].data[].d",
    };
    const expected = {
      comments: [
        {
          data: [
            { c: "a1", d: "b1" },
            { c: "a2", d: "b2" },
          ],
        },
      ],
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("array mapping - simple deep", async () => {
    const obj = {
      thing: {
        comments: [
          { a: "a1", b: "b1" },
          { a: "a2", b: "b2" },
        ],
      },
    };
    const map = {
      "thing.comments[].a": ["thing.comments[].c"],
      "thing.comments[].b": ["thing.comments[].d"],
    };
    const expected = {
      thing: {
        comments: [
          { c: "a1", d: "b1" },
          { c: "a2", d: "b2" },
        ],
      },
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("array mapping - from/to specific indexes", async () => {
    const obj = {
      comments: [
        { a: "a1", b: "b1" },
        { a: "a2", b: "b2" },
      ],
    };
    const map = {
      "comments[0].a": ["comments[1].c"],
      "comments[0].b": ["comments[1].d"],
    };
    const expected = {
      comments: [, { c: "a1", d: "b1" }],
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("array mapping - fromObject is an array", async () => {
    const obj = [
      { a: "a1", b: "b1" },
      { a: "a2", b: "b2" },
    ];
    const map = {
      "[].a": "[].c",
      "[].b": "[].d",
    };
    const expected = [
      { c: "a1", d: "b1" },
      { c: "a2", d: "b2" },
    ];
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("array mapping - fromObject empty array property ignored", async () => {
    const obj = {
      phone_numbers: [],
    };
    const map = {
      phone_numbers: {
        key: "questionnaire.initial.cellPhoneNumber",
        transform: function (sourceValue) {
          let i;

          if (!Array.isArray(sourceValue)) {
            return null;
          }

          for (i = 0; i < sourceValue.length; i++) {
            if (sourceValue[i].primary) {
              return {
                code: sourceValue[i].country_code,
                phone: sourceValue[i].number,
              };
            }
          }
        },
      },
    };
    const target = {
      questionnaire: {
        initial: {},
      },
    };
    const expected = {
      questionnaire: {
        initial: {},
      },
    };
    const result = await om(obj, target, map);
    expect(result).toEqual(expected);
  });

  it("mapping - map full array to single value via transform", async () => {
    const obj = {
      thing: [
        { a: "a1", b: "b1" },
        { a: "a2", b: "b2" },
        { a: "a3", b: "b3" },
      ],
    };
    const map = {
      thing: [
        [
          "thing2",
          function (val, src, dst) {
            const a = val.reduce(function (i, obj) {
              return (i += obj.a);
            }, "");

            return a;
          },
          null,
        ],
      ],
    };
    const expected = {
      thing2: "a1a2a3",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("mapping - map full array without destination key via transform", async () => {
    const obj = {
      thing: {
        thing2: {
          thing3: [
            { a: "a1", b: "b1" },
            { a: "a2", b: "b2" },
            { a: "a3", b: "b3" },
          ],
        },
      },
    };
    const map = {
      "thing.thing2.thing3": [
        [
          null,
          function (val, src, dst) {
            const a = val.reduce(function (i, obj) {
              return (i += obj.a);
            }, "");

            dst.manual = a;
          },
          null,
        ],
      ],
    };
    const expected = {
      manual: "a1a2a3",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("mapping - map full array to same array on destination side", async () => {
    const obj = {
      thing: [
        { a: "a1", b: "b1" },
        { a: "a2", b: "b2" },
        { a: "a3", b: "b3" },
      ],
    };
    const map = {
      thing: "thing2",
    };
    const expected = {
      thing2: [
        { a: "a1", b: "b1" },
        { a: "a2", b: "b2" },
        { a: "a3", b: "b3" },
      ],
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("mapping - map and append full array to existing mapped array", async () => {
    const obj = {
      thing: [
        { a: "a1", b: "b1" },
        { a: "a2", b: "b2" },
        { a: "a3", b: "b3" },
      ],
      thingOther: [
        { a: "a4", b: "b4" },
        { a: "a5", b: "b5" },
        { a: "a6", b: "b6" },
      ],
    };
    const map = {
      thing: "thing2[]+",
      thingOther: "thing2[]+",
    };
    const expected = {
      thing2: [
        [
          { a: "a1", b: "b1" },
          { a: "a2", b: "b2" },
          { a: "a3", b: "b3" },
        ],
        [
          { a: "a4", b: "b4" },
          { a: "a5", b: "b5" },
          { a: "a6", b: "b6" },
        ],
      ],
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - prevent null values from being mapped", async () => {
    const obj = {
      a: 1234,
      foo: {
        bar: null,
      },
    };
    const expected = {
      foo: {
        a: 1234,
      },
    };
    const map = {
      "foo.bar": "bar.bar",
      a: "foo.a",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - allow null values", async () => {
    const obj = {
      a: 1234,
      foo: {
        bar: null,
      },
    };
    const expected = {
      foo: {
        a: 1234,
      },
      bar: null,
    };
    const map = {
      "foo.bar": "bar?",
      a: "foo.a",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("map object to another - allow null values 2", async () => {
    const obj = {
      a: 1234,
      foo: {
        bar: null,
      },
    };
    const expected = {
      foo: {
        a: 1234,
      },
      bar: {
        bar: null,
      },
    };
    const map = {
      "foo.bar": "bar.bar?",
      a: "foo.a",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("original various tests", async () => {
    const merge = require("../index").merge;
    const obj = {
      sku: "12345",
      upc: "99999912345X",
      title: "Test Item",
      descriptions: ["Short description", "Long description"],
      length: 5,
      width: 2,
      height: 8,
      inventory: {
        onHandQty: 0,
        replenishQty: null,
      },
      price: 100,
    };
    const map = {
      sku: "Envelope.Request.Item.SKU",
      upc: "Envelope.Request.Item.UPC",
      title: "Envelope.Request.Item.ShortTitle",
      length: "Envelope.Request.Item.Dimensions.Length",
      width: "Envelope.Request.Item.Dimensions.Width",
      height: "Envelope.Request.Item.Dimensions.Height",
      weight: [
        [
          "Envelope.Request.Item.Weight",
          null,
          function () {
            return 10;
          },
        ],
      ],
      weightUnits: [
        [
          "Envelope.Request.Item.WeightUnits",
          null,
          function () {
            return null;
          },
        ],
      ],
      "inventory.onHandQty": "Envelope.Request.Item.Inventory?",
      "inventory.replenishQty": "Envelope.Request.Item.RelpenishQuantity?",
      "inventory.isInventoryItem": {
        key: ["Envelope.Request.Item.OnInventory", null, "YES"],
      },
      price: [
        "Envelope.Request.Item.Price[].List",
        "Envelope.Request.Item.Price[].Value",
        "Test[]",
      ],
      "descriptions[0]": "Envelope.Request.Item.ShortDescription",
      "descriptions[1]": "Envelope.Request.Item.LongDescription",
    };
    const expected = {
      Test: [100],
      Envelope: {
        Request: {
          Item: {
            SKU: "12345",
            UPC: "99999912345X",
            ShortTitle: "Test Item",
            Dimensions: {
              Length: 5,
              Width: 2,
              Height: 8,
            },
            Weight: 10,
            Inventory: 0,
            RelpenishQuantity: null,
            OnInventory: "YES",
            Price: [
              {
                List: 100,
                Value: 100,
              },
            ],
            ShortDescription: "Short description",
            LongDescription: "Long description",
          },
        },
      },
    };
    let result = await merge(obj, {}, map);
    expect(result).toEqual(expected);
    map.sku = {
      key: "Envelope.Request.Item.SKU",
      transform: function (val, objFrom, objTo) {
        return "over-ridden-sku";
      },
    };
    expected.Envelope.Request.Item.SKU = "over-ridden-sku";
    result = await merge(obj, {}, map);
    expect(result).toEqual(expected);
    obj["inventory"] = null;
    expected.Envelope.Request.Item.Inventory = null;
    result = await merge(obj, {}, map);
    expect(result).toEqual(expected);
  });

  it("map array inside array to property", async () => {
    const obj = {
      orders: [
        {
          foodie: {
            first_name: "Foodie2",
            last_name: "Foodie2",
          },
          sort_code: "A02",
        },
      ],
      transfers: [
        {
          type: "GIVE",
          target_route: {
            _id: "58e4a15607689eafed8e2841",
            driver: "58e4a15607689eafed8e2831",
          },
          orders: ["58e4a15807689eafed8e2d0b"],
        },
      ],
    };
    const expected = {
      orders: [
        {
          foodie: {
            first_name: "Foodie2",
            last_name: "Foodie2",
          },
          sort_code: "A02",
        },
      ],
      transfers: [
        {
          type: "GIVE",
          target_route: {
            _id: "58e4a15607689eafed8e2841",
            driver: "58e4a15607689eafed8e2831",
          },
          orders: ["58e4a15807689eafed8e2d0b"],
        },
      ],
    };
    // would expect this to just assign the array as a property
    const map = {
      "orders[]._id": "orders[]._id",
      "orders[].sort_code": "orders[].sort_code",
      "orders[].foodie._id": "orders[].foodie._id",
      "orders[].foodie.first_name": "orders[].foodie.first_name",
      "orders[].foodie.last_name": "orders[].foodie.last_name",
      "transfers[].type": "transfers[].type",
      "transfers[].orders[]": "transfers[].orders",
      "transfers[].target_route._id": "transfers[].target_route._id",
      "transfers[].target_route.driver": "transfers[].target_route.driver",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Mapping destination property with a literal dot", async () => {
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      "bar.baz": "baz",
    };
    const map = {
      "foo.bar": {
        key: "bar\\.baz",
        transform: function (value, fromObject, toObject, fromKey, toKey) {
          return value;
        },
      },
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Mapping destination property with wrong escaped dot", async () => {
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      bar: { baz: "baz" },
    };
    const map = {
      "foo.bar": {
        key: "bar.baz", // actually equivalent to bar.baz as "bar\.baz" === "bar.baz"
        transform: function (value, fromObject, toObject, fromKey, toKey) {
          return value;
        },
      },
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Mapping destination property with two escaped dots", async () => {
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      "bar.baz.duz": "baz",
    };
    const map = {
      "foo.bar": {
        key: "bar\\.baz\\.duz",
        transform: function (value, fromObject, toObject, fromKey, toKey) {
          return value;
        },
      },
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Mapping destination property with backslash itself escaped", async () => {
    const obj = {
      foo: {
        bar: "baz",
      },
    };
    const expected = {
      "bar\\\\": { baz: "baz" },
    };
    const map = {
      "foo.bar": {
        key: "bar\\\\.baz",
        transform: function (value, fromObject, toObject, fromKey, toKey) {
          return value;
        },
      },
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Mapping properties with glob patterns", async () => {
    const obj = {
      nodes: {
        db_node: {
          type: "db",
          image: "mongodb",
        },
        app_node: {
          type: "app",
          image: "nginx",
        },
      },
    };
    const expected = {
      types: ["db", "app"],
    };
    const map = {
      "nodes.*.type": "types",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Mapping properties with glob patterns with incomplete path", async () => {
    const obj = {
      nodes: {
        db_node: {
          type: "db",
          image: "mongodb",
        },
        app_node: {
          type: "app",
          image: "nginx",
        },
      },
    };
    const expected = {
      types: [
        {
          type: "db",
          image: "mongodb",
        },
        {
          type: "app",
          image: "nginx",
        },
      ],
    };
    const map = {
      "nodes.*": "types",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Object is created when it should not be #57", async () => {
    const obj = {};
    const expected = undefined;
    const map = { key1: "a.b.c" };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Multi-level array issue #29", async () => {
    const orig = {
      foo: [
        { name: "a", things: ["a1", "a2"] },
        { name: "b", things: ["b1", "b2"] },
      ],
    };
    const map = {
      "foo[].name": "bar[].label",
      "foo[].things[]": "bar[].values[]",
    };
    const expected = {
      bar: [
        {
          label: "a",
          values: ["a1", "a2"],
        },
        {
          label: "b",
          values: ["b1", "b2"],
        },
      ],
    };
    const result = await om(orig, map);
    expect(result).toEqual(expected);
  });

  it("Ensure that boolean values work for both arrays and objects #37", async () => {
    const to_obj = {
      test: 1,
    };
    const from_obj = {
      foo: {
        bar: false,
        baz: [1, 2, "three", false],
      },
    };
    const map = {
      "foo.bar": { key: "baz" },
      "foo.baz": "biff",
    };
    const expected = {
      test: 1,
      baz: false,
      biff: [1, 2, "three", false],
    };
    const result = await om(from_obj, to_obj, map);
    expect(result).toEqual(expected);
  });

  it("Ensure that multi-dimentional arrays work #41", async () => {
    const src = {
      arr: [
        {
          id: 1,
        },
      ],
    };
    const expected = null;
    const result = await om.getKeyValue(src, "arr[].arr[].id");
    expect(result).toEqual(expected);
  });

  it("Ensure that multi-dimentional arrays work #41", async () => {
    const src = {
      arr: [
        {
          id: 1,
        },
      ],
    };
    const map = {
      "arr[].id": "arr[].id",
      "arr[].arr[].id": "arr[].arr[].id",
      "arr[].arr[].arr[].id": "arr[].arr[].arr[].id",
    };
    const expected = { arr: [{ id: 1 }] };
    const result = await om(src, map);
    expect(result).toEqual(expected);
  });

  it("Make sure no objects are created without data #48", async () => {
    const obj = {
      a: 1234,
      foo: {
        bar: null,
      },
    };
    const expected = {
      foo: {
        a: 1234,
      },
    };
    const map = {
      "foo.bar": "bar.bar",
      a: "foo.a",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Should correctly map to a subelement of indexed array item.", async () => {
    const obj = {
      nodes: [
        {
          type: "db",
          image: "mongodb",
        },
        {
          type: "app",
          image: "nginx",
        },
      ],
    };
    const expected = {
      result: [
        {
          env: {
            nodes: [
              {
                type: "db",
                image: "mongodb",
              },
              {
                type: "app",
                image: "nginx",
              },
            ],
          },
        },
      ],
    };
    const map = {
      "nodes[].type": "result[0].env.nodes[].type",
      "nodes[].image": "result[0].env.nodes[].image",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("Should correctly map to a subelement of indexed array item deep in the object hierarchy.", async () => {
    const obj = {
      policyNumber: "PN1",
      status: "ST1",
      productName: "PN1",
      productVersion: "PV1",
      productType: "PT1",
      startDate: "SD1",
      endDate: "ED1",
      policyContacts: [
        {
          contactType: "CT11",
          contactId: "CI11",
        },
        {
          contactType: "CT12",
          contactId: "CI12",
        },
      ],
      currency: "CUR1",
      covers: [
        {
          coverName: "CN11",
          coverId: "CID11",
          startDate: "SD11",
          endDate: "ED11",
          excess: "EX11",
          insuredAmount: "IA11",
          yearlyPremium: "YP11",
          status: "ST11",
        },
      ],
      riskObjects: [
        {
          assetId: "AID11",
          type: "T11",
          assetDescription: "AD11",
          address: {
            city: "C11",
            houseNumber: "HN11",
            country: "CN11",
            zipCode: "ZC11",
          },
        },
      ],
    };
    const expected = {
      policyHeader: [
        {
          policiesList: {
            policies: {
              externalPolicyNr: "PN1",
              policyLobsList: {
                policyLobs: {
                  lobRef: {
                    value: "PT1",
                  },
                  policyLobAssetsList: {
                    policyLobAssets: [
                      {
                        coversList: {
                          covers: [
                            {
                              coverPerilsList: {
                                coverPerils: [
                                  {
                                    perilRef: {
                                      value: "CN11",
                                    },
                                  },
                                ],
                              },
                              externalNumber: "CID11",
                              startDate: "SD11",
                              endDate: "ED11",
                              excessAmount: "EX11",
                              insuranceAmount: "IA11",
                              basicYearlyPremiumAmount: "YP11",
                              coverStatusRef: {
                                value: "ST11",
                              },
                            },
                          ],
                        },
                        originalLobAssetId: "AID11",
                        asset: {
                          assetTypeRef: {
                            value: "T11",
                          },
                          propertyOccupationTypeRef: "AD11",
                          address: {
                            cityName: "C11",
                            houseNr: "HN11",
                            countryRef: {
                              value: "CN11",
                            },
                            zipCode: "ZC11",
                          },
                        },
                      },
                    ],
                  },
                },
              },
              policyContactsList: {
                policyContacts: [
                  {
                    policyContactRoleRef: {
                      value: "CT11",
                    },
                    contactExtNum: "CI11",
                  },
                  {
                    policyContactRoleRef: {
                      value: "CT12",
                    },
                    contactExtNum: "CI12",
                  },
                ],
              },
            },
          },
          statusCodeRef: {
            value: "ST1",
          },
          productRef: {
            value: "PN1",
          },
          productVersionRef: {
            value: "PV1",
          },
          policyStartDate: "SD1",
          policyEndDate: "ED1",
          currencyRef: {
            value: "CUR1",
          },
        },
      ],
    };
    const map = {
      "covers[].coverId":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].coversList.covers[].externalNumber",
      "covers[].coverName":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].coversList.covers[].coverPerilsList.coverPerils[0].perilRef.value",
      "covers[].endDate":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].coversList.covers[].endDate",
      "covers[].excess":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].coversList.covers[].excessAmount",
      "covers[].insuredAmount":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].coversList.covers[].insuranceAmount",
      "covers[].startDate":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].coversList.covers[].startDate",
      "covers[].status":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].coversList.covers[].coverStatusRef.value",
      "covers[].yearlyPremium":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].coversList.covers[].basicYearlyPremiumAmount",
      currency: "policyHeader[0].currencyRef.value",
      endDate: "policyHeader[0].policyEndDate",
      "policyContacts[].contactId":
        "policyHeader[0].policiesList.policies.policyContactsList.policyContacts[].contactExtNum",
      "policyContacts[].contactType":
        "policyHeader[0].policiesList.policies.policyContactsList.policyContacts[].policyContactRoleRef.value",
      policyNumber: "policyHeader[0].policiesList.policies.externalPolicyNr",
      productName: "policyHeader[0].productRef.value",
      productType:
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.lobRef.value",
      productVersion: "policyHeader[0].productVersionRef.value",
      "riskObjects[].address.city":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].asset.address.cityName",
      "riskObjects[].address.country":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].asset.address.countryRef.value",
      "riskObjects[].address.houseNumber":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].asset.address.houseNr",
      "riskObjects[].address.zipCode":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].asset.address.zipCode",
      "riskObjects[].assetDescription":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].asset.propertyOccupationTypeRef",
      "riskObjects[].assetId":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].originalLobAssetId",
      "riskObjects[].type":
        "policyHeader[0].policiesList.policies.policyLobsList.policyLobs.policyLobAssetsList.policyLobAssets[].asset.assetTypeRef.value",
      startDate: "policyHeader[0].policyStartDate",
      status: "policyHeader[0].statusCodeRef.value",
    };
    const result = await om(obj, map);
    expect(result).toEqual(expected);
  });

  it("MAP Should correctly create an array and add if undlerlying data structure is object #64", async () => {
    const src = { foo: { bar: "baz" } };
    const map = { "foo[].bar": "abc[].def" };
    const expected = { abc: [{ def: "baz" }] };
    const result = await om(src, map);
    expect(result).toEqual(expected);
  });

  it("MAP Should correctly apply transform in array data #68", async () => {
    const src = {
      test: ["1234", "5678", "9101"],
    };
    const map = {
      "test[]": {
        key: "check[]",
        transform: (val) => parseInt(val),
      },
    };
    const expected = {
      check: [1234, 5678, 9101],
    };
    const result = await om(src, map);
    expect(result).toEqual(expected);
  });

  it("issue #69: should create an array of values", async () => {
    const src = [
      { identification: 1235, name: "John Doe" },
      { identification: 9876, name: "Brock Doe" },
    ];
    const map = { identification: "id" };
    const expected = {
      id: 1235,
    };
    const result = await om(src, map);
    expect(result).toEqual(expected);
  });

  it("issue #71: mapping array should not fail when not defined", async () => {
    const src = {};
    const map = {
      mySizes: [
        {
          key: "sizes",
          transform: (sizes) => sizes.map((data) => data),
          default: () => [],
        },
      ],
    };
    const expected = { sizes: [] };
    const result = await om(src, map);
    expect(result).toEqual(expected);
  });

  it("issue #74: mapping empty array should result in empty array", async () => {
    const src = { nbMember: 5, activityList: [] };
    const map = {
      nbMember: "maxPlayerCount",
      "activityList[].id": "activityList[].id",
    };
    const expected = {
      maxPlayerCount: 5,
    };
    const result = await om(src, map);
    expect(result).toEqual(expected);
  });

  it("Async function", async () => {
    const src = { mySizes: 10 };
    const map = {
      mySizes: [
        {
          key: "sizes",
          transform: (sizes) =>
            new Promise((resolve) => {
              resolve(sizes * 10);
            }),
        },
      ],
    };
    const expected = { sizes: 100 };
    const result = await om(src, map);
    expect(result).toEqual(expected);
  });

  it("map array with function", async () => {
    var obj = {
      theArray: [
        {text:"textvalue"},
        {text:"text"}
      ]
    };

    var expect = {
      newArray: [
        {textSize:9},
        {textSize:4}
      ]
    };

    let transformFunc = {
      key:'newArray[].textSize',
      transform: function (value, src, dest, srcKey, destKey){
        return value.length
      }
    };
    var map = {
      'theArray[].text': transformFunc
    };

    var result = om(obj, map);

    t.deepEqual(result, expect);
    t.end();
  });
});
