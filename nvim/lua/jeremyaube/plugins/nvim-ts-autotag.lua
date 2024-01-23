return {
  "windwp/nvim-ts-autotag",

  config = function()
    local import_tag, autotag = pcall(require, "nvim-ts-autotag")
    if not import_tag then
      return
    end

    autotag.setup({
      autotag = {
        enable = true,
      },
      filetypes = {
        "html",
        "htmldjango",
      },
    })
  end,
}
