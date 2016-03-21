
// CheckFile.jsx
// Digital Art
// Zephyr Mann - 2016
//  
// scans the file to ensure that:
//      1. the artboard has been resized
//      2. white ind. w/ magenta has been changed
//      3. there aren't both PMS and Digital colors present
//
//  displays an alert with a list of all of the colors present in the file and a color count

// calculates the Hue from RGB values
// returns it rounded to the nearest degree
function RGBtoHue(red, green, blue) {
    var inv = 1.0 / 255.0;
    var r = red * inv;
    var g = green * inv;
    var b = blue * inv;
    
    
    var mx = Math.max(r, g, b);
    var mn = Math.min(r, g, b);
    
    var hue = 0;
    if( mx == r )
        hue = (g - b) / (mx - mn);
    else if( mx == g )
        hue = 2 + (b - r) / (mx - mn);
    else
        hue = 4 + (r -g) / (mx - mn);
    
    hue *= 60;
    if (hue < 0)
        hue += 360;
    
    return Math.round(hue).toString();
}


function colorCount() { 
    if( !app.documents.length ) return;
    var doc = app.activeDocument;
    
    var colors = "";
    var count = 0;
    var expanded = false;
    var grayColor = false;
    var blackTone = false;
    var pms = false;
    var digi = false;
    var mag = false;
    
    var countedBlack = false;
    
    var items = doc.pathItems;
    
    var sel = false;
    if( doc.selection.length > 0) {
        sel = true;
        items = [];
        
        for( var i = 0, ii = doc.selection.length; i < ii; i++ ) {
            var temp = doc.selection[i];
            if( temp.typename == "GroupItem" ) {
                for( var j = 0, jj = temp.pathItems.length; j < jj; j++ ) {
                    items.push( temp.pathItems[j] );
                }
                for( var j = 0, jj = temp.compoundPathItems.length; j < jj; j++ ) {
                    items.push( temp.compoundPathItems[j].pathItems[0] );
                }
            }
            else if( temp.typename == "CompoundPathItem" ) {
                items.push( temp.pathItems[0] );
            }
            else if( temp.typename == "PathItem" ) {
                items.push( temp );
            }
        }
    }
    
    // path items
    for( var i = 0, ii = items.length; i < ii ; i++ ) {
        var curPath = items[i];
        
        try {
            if( sel && curPath.typename == "CompoundPathItem" ) curPath = curPath.pathItems[0];
            
            if( sel && curPath.typename != "PathItem" ) continue;
            
            var geoBounds = curPath.geometricBounds;
            if( Math.abs( geoBounds[2] - geoBounds[0] ) == 1008 && Math.abs( geoBounds[3] - geoBounds[1] ) == 1152 ) continue;
            
            if( items[i].filled && items[i].layer.visible && !items[i].layer.locked ) {
                var c = items[i].fillColor;
                
                if( c.typename == "GradientColor" ) {
                    var name, hue;
                    var grads = c.gradient.gradientStops;
                    
                    for( var j = 0, jj = grads.length; j < jj; j++ ) {
                        name = hue = "";
                        var g = grads[j].color;
                        
                        if( g.typename == "SpotColor" ) {
                            hue = RGBtoHue( g.spot.color.red, g.spot.color.green, g.spot.color.blue );
                            name = g.spot.name;
                            expanded = true;
                            
                            if( !digi && name != "Digital White" && name != "Digital Black" && (name.indexOf( "Digital" ) > -1 || name.indexOf( "Trim" ) > -1) )
                                digi = true;
                            else if( !pms && name.indexOf( "PMS" ) > -1 )
                                pms = true;
                            else if( !mag && name.indexOf( "White ind. w/ Magenta" ) > -1 )
                                mag = true;
                            else if( name.indexOf( "Black" ) > -1 )
                                hue = "Black";
                            else if( name.indexOf( "Digital White" ) > -1 )
                                hue = "White";
                            else if( name.indexOf( "Transparent White" ) > -1 )
                                hue = NaN;
                            
                            name += " (Hue " + hue + ")";
                        }
                        else if( g.typename == "RGBColor" ) {
                            if( g.red == g.green && g.red == g.blue ) {
                                if( g.red == 255 )
                                    hue = NaN;
                                else if( g.red == 254 )
                                    hue = "White";
                                else
                                    hue = "Black";
                            }
                            else
                                hue = RGBtoHue(g.red, g.green, g.blue);
                            
                            name = "R=" + g.red + " G=" + g.green + " B=" + g.blue + " (Hue " + hue + ")";
                        }
                        else if( g.typename == "GrayColor" ) {
                            grayColor = true;
                            
                            if( g.gray < 0.39 )
                                hue = NaN;
                            else if( g.gray >= 0.39 && g.gray < 0.78 )
                                hue = "White";
                            else
                                hue = "Black";
                            
                            blackTone = true;
                            
                            name = "K= " + g.gray + " (Hue " + hue + ")";
                        }
                        
                        if( name != "" && colors.indexOf( name ) == -1 ) {
                            if( ( ( !isNaN(hue) || hue == "White" || hue == "Black") && colors.indexOf("Hue " + hue) == -1 ) ) {
                                count++;
                                colors += "* ";
                            }
                            colors += name + "\n";
                        }
                    }
                } // end if gradient color
                else {
                    var name = "";
                    var hue = "";
                    if( c.typename == "SpotColor") {
                        hue = RGBtoHue( c.spot.color.red, c.spot.color.green, c.spot.color.blue );
                        name = c.spot.name;
                        
                        if( !digi && name != "Digital White" && name != "Digital Black" && (name.indexOf( "Digital" ) > -1 || name.indexOf( "Trim" ) > -1) )
                            digi = true;
                        else if( !pms && name.indexOf( "PMS" ) > -1 )
                            pms = true;
                        else if( !mag && name.indexOf( "White ind. w/ Magenta" ) > -1 )
                            mag = true;
                        else if( name.indexOf( "Black" ) > -1 )
                            hue = "Black";
                        else if( name.indexOf( "Digital White" ) > -1 )
                            hue = "White";
                        else if( name.indexOf( "Transparent White" ) > -1 )
                            hue = NaN;
                        
                        name += " (Hue " + hue + ")";
                    }
                    else if( c.typename == "RGBColor" ) {
                        // if grayscale color
                        if( c.red == c.green && c.red == c.blue ) {
                            if( c.red == 255 )
                                hue = NaN;
                            else if( c.red == 254 )
                                hue = "White";
                            else
                                hue = "Black";
                        }
                        // else calculate hue
                        else {
                            hue = RGBtoHue(c.red, c.green, c.blue);
                        }
                        
                        name = "R=" + c.red + " G=" + c.green + " B=" + c.blue + " (Hue " + hue + ")";
                    }
                    else if( c.typename == "GrayColor" ) {
                        grayColor = true;
                        
                        if( c.gray < 0.39 )
                            hue = NaN;
                        else if( c.gray >= 0.39 && c.gray < 0.78 )
                            hue = "White";
                        else
                            hue = "Black";
                        
                        blackTone = true;
                        
                        name = "K= " + c.gray + " (Hue " + hue + ")";
                    }
                    
                    if( name != "" && colors.indexOf( name ) == -1 ) {
                        if( ( ( !isNaN(hue) || hue == "White" || hue == "Black") && colors.indexOf("Hue " + hue) == -1 ) ) {
                            count++;
                            colors += "* ";
                        }
                        colors += name + "\n";
                    }
                } // end else gradient color
                
            } // end if filled
            
            if( items[i].stroked && items[i].layer.visible && !items[i].layer.locked ) {
                var c = items[i].strokeColor;
                
                if( c.typename == "GradientColor" ) {
                    var name, hue;
                    var grads = c.gradient.gradientStops;
                    
                    for( var j = 0, jj = grads.length; j < jj; j++ ) {
                        name = hue = "";
                        var g = grads[j].color;
                        
                        if( g.typename == "SpotColor" ) {
                            hue = RGBtoHue( g.spot.color.red, g.spot.color.green, g.spot.color.blue );
                            name = g.spot.name;
                            expanded = true;
                            
                            if( !digi && name != "Digital White" && name != "Digital Black" && (name.indexOf( "Digital" ) > -1 || name.indexOf( "Trim" ) > -1) )
                                digi = true;
                            else if( !pms && name.indexOf( "PMS" ) > -1 )
                                pms = true;
                            else if( !mag && name.indexOf( "White ind. w/ Magenta" ) > -1 )
                                mag = true;
                            else if( name.indexOf( "Black" ) > -1 )
                                hue = "Black";
                            else if( name.indexOf( "Digital White" ) > -1 )
                                hue = "White";
                            else if( name.indexOf( "Transparent White" ) > -1 )
                                hue = NaN;
                            
                            name += " (Hue " + hue + ")";
                        }
                        else if( g.typename == "RGBColor" ) {
                            if( g.red == g.green && g.red == g.blue ) {
                                if( g.red == 255 )
                                    hue = NaN;
                                else if( g.red == 254 )
                                    hue = "White";
                                else
                                    hue = "Black";
                            }
                            else
                                hue = RGBtoHue(g.red, g.green, g.blue);
                            
                            name = "R=" + g.red + " G=" + g.green + " B=" + g.blue + " (Hue " + hue + ")";
                        }
                        else if( g.typename == "GrayColor" ) {
                            grayColor = true;
                            
                            if( g.gray < 0.39 )
                                hue = NaN;
                            else if( g.gray >= 0.39 && g.gray < 0.78 )
                                hue = "White";
                            else
                                hue = "Black";
                            
                            blackTone = true;
                            
                            name = "K= " + g.gray + " (Hue " + hue + ")";
                        }
                        
                        if( name != "" && colors.indexOf( name ) == -1 ) {
                            if( ( ( !isNaN(hue) || hue == "White" || hue == "Black") && colors.indexOf("Hue " + hue) == -1 ) ) {
                                count++;
                                colors += "* ";
                            }
                            colors += name + "\n";
                        }
                    }
                } // end if gradient color
                else {
                    var name = "";
                    var hue = "";
                    if( c.typename == "SpotColor") {
                        hue = RGBtoHue( c.spot.color.red, c.spot.color.green, c.spot.color.blue );
                        name = c.spot.name;
                        
                        if( !digi && name != "Digital White" && name != "Digital Black" && (name.indexOf( "Digital" ) > -1 || name.indexOf( "Trim" ) > -1) )
                            digi = true;
                        else if( !pms && name.indexOf( "PMS" ) > -1 )
                            pms = true;
                        else if( !mag && name.indexOf( "White ind. w/ Magenta" ) > -1 )
                            mag = true;
                        else if( name.indexOf( "Black" ) > -1 )
                            hue = "Black";
                        else if( name.indexOf( "Digital White" ) > -1 )
                            hue = "White";
                        else if( name.indexOf( "Transparent White" ) > -1 )
                            hue = NaN;
                        
                        name += " (Hue " + hue + ")";
                    }
                    else if( c.typename == "RGBColor" ) {
                        // if grayscale color
                        if( c.red == c.green && c.red == c.blue ) {
                            if( c.red == 255 )
                                hue = NaN;
                            else if( c.red == 254 )
                                hue = "White";
                            else
                                hue = "Black";
                        }
                        // else calculate hue
                        else {
                            hue = RGBtoHue(c.red, c.green, c.blue);
                        }
                        
                        name = "R=" + c.red + " G=" + c.green + " B=" + c.blue + " (Hue " + hue + ")";
                    }
                    else if( c.typename == "GrayColor" ) {
                        grayColor = true;
                        
                        if( c.gray < 0.39 )
                            hue = NaN;
                        else if( c.gray >= 0.39 && c.gray < 0.78 )
                            hue = "White";
                        else
                            hue = "Black";
                        
                        blackTone = true;
                        
                        name = "K= " + c.gray + " (Hue " + hue + ")";
                    }
                    
                    if( name != "" && colors.indexOf( name ) == -1 ) {
                        if( ( ( !isNaN(hue) || hue == "White" || hue == "Black") && colors.indexOf("Hue " + hue) == -1 ) ) {
                            count++;
                            colors += "* ";
                        }
                        colors += name + "\n";
                    }
                } // end else gradient color
            
            } // end if stroked
        } // end try
        catch(err) {
            Window.alert( "Something went wrong!\nTry running the command again!", "~ Oops! ~", true );
            return [-1, -1, -1, -1, -1, -1, -1, -1];
        }
        
    } // end for loop
    
    // **ADD RGB COLORS**
    // raster items
    items = doc.rasterItems;
    for( var i = 0, ii = items.length; !sel && i < ii; i++ ) {
        if( items[i].colorizedGrayscale ) {
            var c = items[i].colorants;
            var curPath = items[i];
            
            if( c[0] != "Red" )  {
                
                if( !digi && c[0] != "Digital White" && c[0] != "Digital Black" && c[0].indexOf( "Digital" ) > -1 )
                    digi = true;
                else if( !pms && c[0].indexOf( "PMS" ) > -1 )
                    pms = true;
                else if( !mag && c[0].indexOf( "White ind. w/ Magenta" ) > -1 )
                    mag = true;
                
                if( colors.indexOf( c[0] ) == -1 ) {
                    colors += c[0] + "\n";
                    
                    if( !( c[0].indexOf( "Black" ) > -1 && colors.indexOf( "Black" ) > -1) )
                        count++;
                }
            }
            else if ( c[0] == "Gray" ) {
                blackTone = true;
            }
        }
    }

    //
    //
    return [colors, count, pms, digi, expanded, grayColor, blackTone, mag];
}


function checkDocument() {
    if( !app.documents.length ) return;
    var doc = app.activeDocument;
    
    var resize = Math.abs( doc.artboards[0].artboardRect[1] - doc.artboards[0].artboardRect[3] ) != 1152;
    
    var colors = colorCount();
    if( colors[0] == -1 ) return;
    
    var count = colors[1];
    var pms = colors[2];
    var digi = colors[3];
    var expanded = colors[4];
    var grayColor = colors[5];
    var blackTint = colors[6];
    var mag = colors[7];
    colors = colors[0];
    var inks = colors.split("\n"); //doc.inkList;
    
    /*for( i = 0; i < inks.length; i++ ) {
        //$.write(inks[i]+"\n");
        if( inks[i].indexOf("PMS") > -1 ) {
            pms = true;
        }
        else if( inks[i].indexOf( "Digital" ) > -1 && ( inks[i].indexOf("Digital White") == -1 && inks[i].indexOf("Digital Black") == -1 ) ) {
            digi = true;
        }
        else if( inks[i].indexOf("w/ Magenta") > -1 ) {
            mag  = true;
        }
    }*/
    
    if( mag ) {
        Window.alert("White ind. w/ Magenta Present!", "Check Yourself!", true);
        return;
    }
    
    var msg = "";
    var title = "Good To Go!";
    var error = false;
    
    if( expanded ) {
        msg = "Don't Forget to Expand Gradients!\n\n";
        title = "Check Yourself!";
    }
    
    if( blackTint ) {
        msg += "Change Grayscale Colors (K) to\nTints of Digital Black!\n\n";
        title = "Check Yourself!";
        error = true;
    }
    
    if( resize ) {
        msg += "Resize Artboard\n\n";
        title = "Check Yourself!";
        error = true;
    }

    if( pms && digi ) {
        msg += "Both PMS & Digital Colors Present\n\n";
        title = "Check Yourself!";
        error = true;
    }
    else if( pms )
        msg += "All PMS Colors!";
    else if( digi )
        msg += "All Digital Colors!";
    else
        msg += "No Color Swatches Present!";
    
    msg += "\n\nColor Count: " + count + "\n\n" + colors;
    
    Window.alert(msg, title, error);
}

checkDocument();