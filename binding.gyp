{
  "targets": [
    {
      "target_name": "patchr",
      "sources": [ "patchr.cc" ],
      "include_dirs" : [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}