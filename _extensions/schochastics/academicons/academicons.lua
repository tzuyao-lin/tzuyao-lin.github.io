local function ensureHtmlDeps()
  quarto.doc.addHtmlDependency({
    name = "academicons",
    version = "1.9.2",
    stylesheets = {"assets/css/all.css", "assets/css/size.css"}
  })
end

local function isEmpty(s)
  return s == nil or s == ''
end

local function isValidSize(size)
  local validSizes = {
    "tiny", "scriptsize", "footnotesize", "small", "normalsize",
    "large", "Large", "LARGE", "huge", "Huge",
    "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x",
    "2xs", "xs", "sm", "lg", "xl", "2xl"
  }
  for _, v in ipairs(validSizes) do
    if v == size then
      return " ai-" .. size
    end
  end
  return ""
end

return {
  ["ai"] = function(args, kwargs)

    local group = ""
    local icon = pandoc.utils.stringify(args[1])
    if #args > 1 then
      group = icon
      icon = pandoc.utils.stringify(args[2])
    end

    local size = isValidSize(pandoc.utils.stringify(kwargs["size"]))
    
    local color = pandoc.utils.stringify(kwargs["color"])
    if not isEmpty(color) then
      color = " style=\"color:" .. color  .. "\""
    end
    
    local title = pandoc.utils.stringify(kwargs["title"])
    if not isEmpty(title) then
      title = " title=\"" .. title  .. "\""
    end

    -- detect html (excluding epub)
    if quarto.doc.isFormat("html:js") then
      ensureHtmlDeps()
      local classes = "ai"
      if not isEmpty(group) then
        classes = classes .. " " .. group
      end
      classes = classes .. " ai-" .. icon .. size
      return pandoc.RawInline(
        'html',
        "<i class=\"" .. classes .. "\"" .. title .. color .. "></i>"
      )
    else
      return pandoc.Null()
    end

  end
}
