require 'rubygems'
require 'bundler/setup'
require 'uglifier'

source = %w(./source/jquery.parkingmap-dependencies.js jquery.parkingmap.js).map do |file_name|
  File.read(file_name)
end.join("\n")

js = Uglifier.new.compile(source)

File.open('jquery.parkingmap.min.js', 'w') do |f|
  f.write js
end
