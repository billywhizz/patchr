{
  "targets": [
    {
      "target_name": "patchr",
      "sources": [ "patchr.c", "patchr.cc" ],
      "include_dirs" : [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}