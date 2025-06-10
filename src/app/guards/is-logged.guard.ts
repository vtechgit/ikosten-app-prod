import { CanActivateFn } from '@angular/router';

export const isLoggedGuard: CanActivateFn = (route, state) => {
  let session = localStorage.getItem('userSession') && localStorage.getItem('userSession') != '' ? JSON.parse(localStorage.getItem('userSession')) : undefined;

  if( session && session._id && session._id != ''){
    location.href='/';
    return false;

  }else{
    console.log('true');

    return true;


  }
};
